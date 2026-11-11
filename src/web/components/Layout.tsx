import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SideNavigation from './SideNavigation';
import Navigation from './Navigation';
import { HealthIndicator, HealthSuccessToast } from './HealthIndicator';
import { DuplicateIdWarning } from './DuplicateIdWarning';
import type { DuplicateRepairPlan } from '../../core/duplicate-task-repair';
import { type Task, type Document } from '../../types';

interface LayoutProps {
 dataVersion?: number;
	projectName: string;
	showSuccessToast: boolean;
	onDismissToast: () => void;
	tasks: Task[];
	docs: Document[];
	isLoading: boolean;
	loadingMessage?: string | null;
	error?: Error | null;
	onRefreshData: () => Promise<void>;
	duplicateRepairPlan?: DuplicateRepairPlan | null;
}

export default function Layout({
 dataVersion,
	projectName,
	showSuccessToast,
	onDismissToast,
	tasks,
	docs,
	isLoading,
	loadingMessage,
	error,
	onRefreshData,
	duplicateRepairPlan = null,
}: LayoutProps) {
	return (
		<div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors duration-200">
			<HealthIndicator />
			<SideNavigation 
				taskCount={tasks.length}
 tasks={tasks}
 dataVersion={dataVersion}
				docs={docs}
				isLoading={isLoading}
				error={error}
				onRetry={onRefreshData}
				onRefreshData={onRefreshData}
			/>
			<div className="flex-1 flex flex-col min-h-0 min-w-0">
				<Navigation projectName={projectName} loadingMessage={loadingMessage} />
				<DuplicateIdWarning plan={duplicateRepairPlan} onRepaired={onRefreshData} />
				<main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
					<Suspense fallback={<LoadingSpinner className="h-full" />}>
						<Outlet context={{ tasks, docs, isLoading, onRefreshData }} />
					</Suspense>
				</main>
			</div>
			{showSuccessToast && (
				<HealthSuccessToast onDismiss={onDismissToast} />
			)}
		</div>
	);
}
