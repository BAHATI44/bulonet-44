import { createContext, useContext, useState, ReactNode } from "react";

type Locale = "fr" | "en" | "ar" | "sw" | "pt" | "zh";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  fr: { "app.name": "BULONET", "nav.home": "Accueil", "nav.catalog": "Catalogue", "nav.cart": "Panier", "nav.account": "Mon compte", "nav.login": "Connexion" },
  en: { "app.name": "BULONET", "nav.home": "Home", "nav.catalog": "Catalog", "nav.cart": "Cart", "nav.account": "My Account", "nav.login": "Login" },
  ar: { "app.name": "BULONET", "nav.home": "الرئيسية", "nav.catalog": "الكتالوج", "nav.cart": "السلة", "nav.account": "حسابي", "nav.login": "تسجيل الدخول" },
  sw: { "app.name": "BULONET", "nav.home": "Nyumbani", "nav.catalog": "Orodha", "nav.cart": "Kikapu", "nav.account": "Akaunti", "nav.login": "Ingia" },
  pt: { "app.name": "BULONET", "nav.home": "Início", "nav.catalog": "Catálogo", "nav.cart": "Carrinho", "nav.account": "Minha Conta", "nav.login": "Entrar" },
  zh: { "app.name": "BULONET", "nav.home": "首页", "nav.catalog": "目录", "nav.cart": "购物车", "nav.account": "我的账户", "nav.login": "登录" },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>("fr");

  const t = (key: string) => translations[locale]?.[key] || translations.fr[key] || key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
