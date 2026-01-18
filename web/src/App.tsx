import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import useNavigateTo from "./hooks/useNavigateTo";
import { instanceStore, userStore } from "./store";
import { loadGtag } from "./utils/analytics";
import { cleanupExpiredOAuthState } from "./utils/oauth";
import { loadTheme, setupSystemThemeListener } from "./utils/theme";

const App = observer(() => {
  const { i18n } = useTranslation();
  const navigateTo = useNavigateTo();
  const instanceProfile = instanceStore.state.profile;
  const instanceProfileLoaded = instanceStore.state.profileLoaded;
  const userGeneralSetting = userStore.state.userGeneralSetting;
  const instanceGeneralSetting = instanceStore.state.generalSetting;

  // Clean up expired OAuth states on app initialization
  useEffect(() => {
    cleanupExpiredOAuthState();
  }, []);

  // Defer analytics until idle to avoid blocking initial render
  useEffect(() => {
    if (!import.meta.env.PROD) {
      return;
    }

    const scheduleLoad = () => {
      loadGtag().catch(() => {});
    };

    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(scheduleLoad);
      return () => win.cancelIdleCallback?.(id);
    }

    const timeout = window.setTimeout(scheduleLoad, 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  // Redirect to sign up page if no instance owner.
  useEffect(() => {
    if (!instanceProfileLoaded) {
      return;
    }
    if (!instanceProfile.owner) {
      navigateTo("/auth/signup");
    }
  }, [instanceProfileLoaded, instanceProfile.owner]);

  useEffect(() => {
    if (instanceGeneralSetting.additionalStyle) {
      const styleEl = document.createElement("style");
      styleEl.innerHTML = instanceGeneralSetting.additionalStyle;
      styleEl.setAttribute("type", "text/css");
      document.body.insertAdjacentElement("beforeend", styleEl);
    }
  }, [instanceGeneralSetting.additionalStyle]);

  useEffect(() => {
    if (instanceGeneralSetting.additionalScript) {
      const scriptEl = document.createElement("script");
      scriptEl.innerHTML = instanceGeneralSetting.additionalScript;
      document.head.appendChild(scriptEl);
    }
  }, [instanceGeneralSetting.additionalScript]);

  // Dynamic update metadata with customized profile.
  useEffect(() => {
    if (!instanceGeneralSetting.customProfile) {
      return;
    }

    document.title = instanceGeneralSetting.customProfile.title;
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    link.href = instanceGeneralSetting.customProfile.logoUrl || "/logo.webp";
  }, [instanceGeneralSetting.customProfile]);

  useEffect(() => {
    const currentLocale = instanceStore.state.locale;
    // This will trigger re-rendering of the whole app.
    i18n.changeLanguage(currentLocale);
    document.documentElement.setAttribute("lang", currentLocale);
    if (["ar", "fa"].includes(currentLocale)) {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
  }, [instanceStore.state.locale]);

  useEffect(() => {
    if (!userGeneralSetting) {
      return;
    }

    instanceStore.state.setPartial({
      locale: userGeneralSetting.locale || instanceStore.state.locale,
      theme: userGeneralSetting.theme || instanceStore.state.theme,
    });
  }, [userGeneralSetting?.locale, userGeneralSetting?.theme]);

  // Load theme when instance theme changes or user setting changes
  useEffect(() => {
    const currentTheme = userGeneralSetting?.theme || instanceStore.state.theme;
    if (currentTheme) {
      loadTheme(currentTheme);
    }
  }, [userGeneralSetting?.theme, instanceStore.state.theme]);

  // Listen for system theme changes when using "system" theme
  useEffect(() => {
    const currentTheme = userGeneralSetting?.theme || instanceStore.state.theme;

    // Only set up listener if theme is "system"
    if (currentTheme !== "system") {
      return;
    }

    // Set up listener for OS theme preference changes
    const cleanup = setupSystemThemeListener(() => {
      // Reload theme when system preference changes
      loadTheme(currentTheme);
    });

    // Cleanup listener on unmount or when theme changes
    return cleanup;
  }, [userGeneralSetting?.theme, instanceStore.state.theme]);

  return <Outlet />;
});

export default App;
