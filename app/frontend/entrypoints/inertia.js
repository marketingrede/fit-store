import { createInertiaApp } from "@inertiajs/svelte"
import { mount } from "svelte"

import "./application.css"

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("../pages/**/*.svelte", { eager: true })
    const page = pages[`../pages/${name}.svelte`]

    if (!page) {
      console.error(`Componente Inertia ausente: '${name}.svelte'`)
    }

    return page?.default
  },
  setup({ el, App, props }) {
    if (el) {
      mount(App, { target: el, props })
    } else {
      console.error("Elemento raiz Inertia não encontrado.")
    }
  },
  progress: {
    color: "#2dbda8",
  },
})
