import { ComponentProps, createSignal, onMount, onCleanup } from "solid-js"
import MarkDark from "./logo-mark-dark.png?url"
import MarkLight from "./logo-mark-light.png?url"
import SplashDark from "./logo-splash-dark.png?url"
import SplashLight from "./logo-splash-light.png?url"
import LogoDark from "./logo-full-dark.png?url"
import LogoLight from "./logo-full-light.png?url"

function useColorScheme() {
  const [scheme, setScheme] = createSignal<"light" | "dark">("light")

  onMount(() => {
    const getScheme = () => {
      if (document.documentElement.dataset.colorScheme === "dark") {
        return "dark"
      }
      return "light"
    }
    setScheme(getScheme())

    const observer = new MutationObserver(() => {
      setScheme(getScheme())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-scheme"],
    })
    onCleanup(() => observer.disconnect())
  })

  return scheme
}

export const Mark = (props: { class?: string }) => {
  const scheme = useColorScheme()
  return <img src={scheme() === "dark" ? MarkDark : MarkLight} class={props.class} alt="logo" />
}

export const Splash = (props: Pick<ComponentProps<"img">, "ref" | "class">) => {
  const scheme = useColorScheme()
  return <img ref={props.ref} src={scheme() === "dark" ? SplashDark : SplashLight} class={props.class} alt="logo" />
}

export const Logo = (props: { class?: string }) => {
  const scheme = useColorScheme()
  return <img src={scheme() === "dark" ? LogoDark : LogoLight} class={props.class} alt="logo" />
}
