"use client";

import { useState, useCallback, useEffect } from "react";
import { t, type Locale } from "../i18n";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { GameGrid } from "./GameGrid";
import { Progress } from "./Progress";
import { Secrets } from "./Secrets";
import { EasterEggs } from "./EasterEggs";
import { Footer } from "./Footer";
import { GameManager } from "./GameManager";

export function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("game-vault-locale") as Locale) || "de";
    }
    return "de";
  });

  useEffect(() => {
    localStorage.setItem("game-vault-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const handleLocaleChange = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
  }, []);

  const handleScrollToGames = useCallback(() => {
    document.getElementById("games-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <Header locale={locale} onLocaleChange={handleLocaleChange} onScrollToGames={handleScrollToGames} />
      <main id="main" className="pt-20">
        <Hero locale={locale} onScrollToGames={handleScrollToGames} />
        <GameGrid locale={locale} onPlay={(gameId) => { window.dispatchEvent(new CustomEvent("play-game", { detail: { gameId } })); }} />
        <Progress locale={locale} />
        <Secrets locale={locale} />
        <EasterEggs locale={locale} />
      </main>
      <Footer locale={locale} />
      <GameManager locale={locale} />
    </>
  );
}