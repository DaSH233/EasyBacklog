import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import chinese from "../locales/zh-CN.json";

export type Language = "en" | "zh-CN";
const storageKey = "backlog-language";
const messages: Record<string, string> = chinese;

export function translate(language: Language, message: string, values: Record<string, string | number> = {}): string {
	const text = language === "zh-CN" ? (Object.hasOwn(messages, message) ? messages[message]! : message) : message;
	return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

const LanguageContext = createContext({
	language: "en" as Language,
	setLanguage: (_language: Language) => {},
	t: (message: string, values?: Record<string, string | number>) => translate("en", message, values),
});

export const useTranslation = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, updateLanguage] = useState<Language>(() => {
		try {
			return localStorage.getItem(storageKey) === "zh-CN" ? "zh-CN" : "en";
		} catch {
			return "en";
		}
	});
	const setLanguage = useCallback((next: Language) => {
		updateLanguage(next);
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			// Switching still works when the browser disallows persistent storage.
		}
	}, []);
	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key === storageKey || event.key === null) {
				updateLanguage(event.newValue === "zh-CN" ? "zh-CN" : "en");
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);
	const t = useCallback(
		(message: string, values?: Record<string, string | number>) => translate(language, message, values),
		[language],
	);
	return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
