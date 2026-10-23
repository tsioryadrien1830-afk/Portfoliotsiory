(function () {
  function handleSubmit(e) {
    console.log("[AIBUI] Form submit intercepted");
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const msg = form.querySelector(".aibui-form-message");
    const successMsgInput = form.querySelector('input[name="success_message"]');
    const successMessage = successMsgInput
      ? successMsgInput.value
      : "Thank you, your message has been sent.";
    if (submitBtn) submitBtn.disabled = true;
    if (msg) {
      msg.textContent = "";
      msg.className = "aibui-form-message";
    }

    const formData = new FormData(form);
    // Simple guard to prevent bots (honeypot)
    if (formData.get("website")) {
      if (msg) {
        msg.textContent = "Submission blocked.";
        msg.classList.add("is-error");
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    var endpoint = form.getAttribute("data-endpoint") || form.action;
    fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res
          .text()
          .then(function (text) {
            var json = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch (e) {}
            return { ok: res.ok, status: res.status, json: json, text: text };
          })
          .catch(function (err) {
            return { ok: false, status: 0, json: null, text: String(err) };
          });
      })
      .then(function (resp) {
        console.log("endpoint ", endpoint);
        console.log("form ", form);
        var success = resp.json && resp.json.success;
        if (success) {
          if (msg) {
            msg.textContent = successMessage;
            msg.classList.add("is-success");
          }
          form.reset();
          return;
        }
        var serverMsg = null;
        if (resp.json && resp.json.data) serverMsg = String(resp.json.data);
        else if (resp.text) serverMsg = resp.text;
        if (msg) {
          msg.textContent =
            serverMsg || "HTTP " + resp.status + " error at " + endpoint;
          msg.classList.add("is-error");
        }
        if (serverMsg) {
          try {
            console.error("Contact form error:", serverMsg);
          } catch (e) {}
        }
      })
      .catch(function (err) {
        if (msg) {
          msg.textContent = "Network error.";
          msg.classList.add("is-error");
        }
        try {
          console.error("Contact form network error:", err);
        } catch (e) {}
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  function init() {
    var forms = document.querySelectorAll(".aibui-contact-form--frontend");
    console.log("[AIBUI] Found forms:", forms.length);
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleSubmit);
      console.log("[AIBUI] Attached submit handler to form", i);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
