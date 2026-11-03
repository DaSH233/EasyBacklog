import { Link } from "react-router-dom";
import { useRecordLinks } from "../contexts/TaskIdIndexContext";
import { useTranslation } from "../contexts/LanguageContext";

export default function ReferencedBy({ recordKey }: { recordKey: string }) {
	const { backlinks } = useRecordLinks();
	const { t } = useTranslation();
	const tasks = backlinks.get(recordKey) ?? [];
	if (!tasks.length) return null;
	return (
		<section className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
			<h2 className="text-lg font-semibold mb-3">{t("Referenced by")}</h2>
			<ul className="space-y-2">
				{tasks.map((task) => (
					<li key={task.id}>
						<Link className="text-blue-600 dark:text-blue-400 hover:underline break-words" to={`/tasks/${task.id}`}>
							{task.id} — {task.title}
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
