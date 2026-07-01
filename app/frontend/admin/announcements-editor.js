import Quill from "quill"
import "quill/dist/quill.snow.css"

let editorInstance = null

export function initAnnouncementEditor() {
  const root = document.querySelector("[data-announcement-editor]")
  const mount = root?.querySelector("[data-quill-mount]")
  const hidden = root?.querySelector('input[name="announcement[content_html]"], textarea[name="announcement[content_html]"]')
  if (!mount || !hidden) return

  editorInstance = new Quill(mount, {
    theme: "snow",
    modules: {
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"]
      ]
    }
  })

  if (hidden.value) {
    editorInstance.root.innerHTML = hidden.value
  }

  const form = root.closest("form")
  form?.addEventListener("submit", () => {
    hidden.value = editorInstance.root.innerHTML
  })
}

export function teardownAnnouncementEditor() {
  editorInstance = null
}
