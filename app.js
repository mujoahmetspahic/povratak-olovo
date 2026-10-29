const API_BASE = "https://povratak-admin.uorpovratak.workers.dev";

async function api(path, opt = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(opt.headers || {})
    },
    ...opt
  });

  const data = await response.json().catch(() => ({
    error: "Greška servera"
  }));

  if (!response.ok) throw Error(data.error || "Greška");
  return data;
}

async function publicContent() {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  for (const [kind, selector] of [
    ["news", "#news"],
    ["project", "#projects"]
  ]) {
    const container = $(selector);
    if (!container) continue;

    try {
      const response = await fetch(
        `${API_BASE}/api/content?kind=${kind}`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) throw Error("Sadržaj nije dostupan");

      const data = await response.json();

      container.innerHTML = (data.items || []).map(item => `
        <article>
          <p class="eyebrow">${esc(item.category)}</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary)}</p>
          ${item.body ? `
            <details>
              <summary>Pročitaj više</summary>
              <p>${esc(item.body).replace(/\n/g, "<br>")}</p>
            </details>
          ` : ""}
        </article>
      `).join("") || `
        <article>
          <h3>Uskoro</h3>
          <p>Nove objave ćemo dodati ovdje.</p>
        </article>
      `;
    } catch (error) {
      console.error(error);
      container.innerHTML =
        "<p>Objave trenutno nisu dostupne.</p>";
    }
  }
}

async function admin() {
  if (!$("#login-form")) return;

  const login = $("#login");
  const dashboard = $("#dashboard");

  async function refresh() {
    try {
      const data = await api("/api/content");
      const items = data.items || [];

      login.hidden = true;
      dashboard.hidden = false;

      $("#items").innerHTML = items.map(item => `
        <article class="entry">
          <div>
            <b>${esc(item.title)}</b>
            <small>${esc(item.kind)} · ${
              item.published ? "Objavljeno" : "Skica"
            }</small>
          </div>
          <span>
            <button class="btn secondary"
              data-edit="${esc(item.id)}">Uredi</button>
            <button class="btn danger"
              data-del="${esc(item.id)}">Obriši</button>
          </span>
        </article>
      `).join("") || "<p>Nema objava.</p>";

      document.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = () => {
          const item = items.find(x => x.id === button.dataset.edit);
          if (!item) return;

          $("#id").value = item.id;
          $("#kind").value = item.kind;
          $("#title").value = item.title;
          $("#category").value = item.category || "";
          $("#summary").value = item.summary || "";
          $("#body").value = item.body || "";
          $("#image").value = item.image_url || "";
          $("#published").checked = !!item.published;

          scrollTo(0, 0);
        };
      });

      document.querySelectorAll("[data-del]").forEach(button => {
        button.onclick = async () => {
          if (!confirm("Obrisati objavu?")) return;

          try {
            await api("/api/content/" + button.dataset.del, {
              method: "DELETE"
            });
            await refresh();
          } catch (error) {
            alert(error.message);
          }
        };
      });
    } catch (error) {
      login.hidden = false;
      dashboard.hidden = true;

      if (error.message !== "Potrebna je prijava.") {
        $("#login-msg").textContent = error.message;
      }
    }
  }

  $("#login-form").onsubmit = async event => {
    event.preventDefault();

    try {
      await api("/api/login", {
        method: "POST",
        body: JSON.stringify({
          password: $("#password").value
        })
      });

      $("#password").value = "";
      $("#login-msg").textContent = "";
      await refresh();
    } catch (error) {
      $("#login-msg").textContent = error.message;
    }
  };

  $("#logout").onclick = async () => {
    await api("/api/logout", {
      method: "POST",
      body: "{}"
    });

    dashboard.hidden = true;
    login.hidden = false;
  };

  $("#new").onclick = () => {
    $("#item-form").reset();
    $("#id").value = "";
    $("#published").checked = true;
    $("#form-msg").textContent = "";
  };

  $("#item-form").onsubmit = async event => {
    event.preventDefault();

    const id = $("#id").value;
    const item = {
      kind: $("#kind").value,
      title: $("#title").value,
      category: $("#category").value,
      summary: $("#summary").value,
      body: $("#body").value,
      image_url: $("#image").value,
      published: $("#published").checked
    };

    try {
      await api(
        id ? "/api/content/" + id : "/api/content",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(item)
        }
      );

      $("#form-msg").textContent = "Sačuvano.";
      $("#item-form").reset();
      $("#id").value = "";
      $("#published").checked = true;
      await refresh();
    } catch (error) {
      $("#form-msg").textContent = error.message;
    }
  };

  await refresh();
}

publicContent();
admin();
