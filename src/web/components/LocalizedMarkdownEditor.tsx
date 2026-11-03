import MDEditor, { commands as editorCommands, type ICommand, type MDEditorProps } from "@uiw/react-md-editor";
import { useMemo } from "react";
import { useTranslation } from "../contexts/LanguageContext";

/** Localize editor chrome, leaving Markdown and inserted syntax untouched. */
export default function LocalizedMarkdownEditor(props: MDEditorProps) {
	const { t } = useTranslation();
	const [commands, extraCommands] = useMemo(() => {
		const localize = (item: ICommand): ICommand => {
			const translated: ICommand = {
				...item,
				buttonProps: item.buttonProps
					? {
							...item.buttonProps,
							title: item.buttonProps.title ? t(item.buttonProps.title) : undefined,
							"aria-label": item.buttonProps["aria-label"] ? t(item.buttonProps["aria-label"]) : undefined,
						}
					: item.buttonProps,
			};
			return Array.isArray(item.children) ? { ...translated, children: item.children.map(localize) } : translated;
		};
		const filter = (items: ICommand[], isExtra: boolean) =>
			items.flatMap((item) => {
				const filtered = props.commandsFilter ? props.commandsFilter(item, isExtra) : item;
				return filtered ? [localize(filtered)] : [];
			});
		return [
			filter(props.commands ?? editorCommands.getCommands(), false),
			filter(props.extraCommands ?? editorCommands.getExtraCommands(), true),
		];
	}, [t, props.commands, props.extraCommands, props.commandsFilter]);
	// The editor refreshes its toolbar when these arrays change, not when commandsFilter changes.
	return <MDEditor {...props} commands={commands} extraCommands={extraCommands} commandsFilter={undefined} />;
}
