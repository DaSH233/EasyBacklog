import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Command } from "commander";
import zshScript from "../../completions/_backlog" with { type: "text" };
import bashScript from "../../completions/backlog.bash" with { type: "text" };
import fishScript from "../../completions/backlog.fish" with { type: "text" };
import pwshScript from "../../completions/backlog.ps1" with { type: "text" };
import { getCompletions } from "../completions/helper.ts";

const completionScripts: Record<Shell, string> = {
	bash: bashScript,
	zsh: zshScript,
	fish: fishScript,
	pwsh: pwshScript,
};

export type Shell = "bash" | "zsh" | "fish" | "pwsh";

interface InstallPaths {
	system?: string;
	user: string;
}

type PowerShellProfileResolver = () => string;

type CompletionInstallOptions = {
	homeDir?: string;
	resolvePowerShellProfilePath?: PowerShellProfileResolver;
};

function getScriptFilename(shell: Shell): string {
	const scriptFiles: Record<Shell, string> = {
		bash: "backlog.bash",
		zsh: "_backlog",
		fish: "backlog.fish",
		pwsh: "backlog.ps1",
	};

	return scriptFiles[shell];
}

function resolvePowerShellProfilePath(): string {
	const executables = ["pwsh"];
	const windowsExecutablePaths = process.platform === "win32" ? getWindowsPowerShellExecutables() : [];
	const candidates = [...executables, ...windowsExecutablePaths];
	const errors: string[] = [];

	for (const executable of candidates) {
		const result = spawnSync(executable, ["-NoProfile", "-Command", "$PROFILE.CurrentUserAllHosts"], {
			encoding: "utf-8",
			windowsHide: true,
		});

		if (result.error) {
			errors.push(`${executable}: ${result.error.message}`);
			continue;
		}

		if (result.status !== 0) {
			const failure = result.stderr.trim() || result.stdout.trim() || `exit code ${result.status}`;
			errors.push(`${executable}: ${failure}`);
			continue;
		}

		const profilePath = result.stdout.trim();
		if (!profilePath) {
			errors.push(`${executable}: returned empty profile path`);
			continue;
		}

		return profilePath;
	}

	const details = errors.map((error) => `  - ${error}`);
	throw new Error(
		[
			"Could not resolve your PowerShell profile path automatically.",
			"Ensure PowerShell 7+ (pwsh) is installed (PATH lookup and common Windows install paths were checked).",
			"Resolution attempts:",
			...details,
		].join("\n"),
	);
}

function getWindowsPowerShellExecutables(): string[] {
	const candidates = [
		process.env.ProgramFiles ? join(process.env.ProgramFiles, "PowerShell", "7", "pwsh.exe") : null,
		process.env["ProgramFiles(x86)"] ? join(process.env["ProgramFiles(x86)"], "PowerShell", "7", "pwsh.exe") : null,
	].filter((path): path is string => Boolean(path));

	return candidates.filter((path) => existsSync(path));
}

export interface CompletionInstallResult {
	shell: Shell;
	installPath: string;
	instructions: string;
}

/**
 * Detect the user's current shell
 */
function detectShell(): Shell | null {
	const shell = process.env.SHELL || "";

	if (shell.includes("bash")) {
		return "bash";
	}
	if (shell.includes("zsh")) {
		return "zsh";
	}
	if (shell.includes("fish")) {
		return "fish";
	}
	if (shell.includes("pwsh")) {
		return "pwsh";
	}

	return null;
}

/**
 * Get installation paths for a shell
 */
function getInstallPaths(
	shell: Shell,
	resolvePowerShellProfile: PowerShellProfileResolver = resolvePowerShellProfilePath,
	home = homedir(),
): InstallPaths {
	if (shell === "pwsh") {
		const profilePath = resolvePowerShellProfile();
		const profileDir = dirname(profilePath);

		return {
			user: join(profileDir, "Completions", "backlog-completion.ps1"),
		};
	}

	const paths: Record<Exclude<Shell, "pwsh">, InstallPaths> = {
		bash: {
			system: "/etc/bash_completion.d/backlog",
			user: join(home, ".local/share/bash-completion/completions/backlog"),
		},
		zsh: {
			system: "/usr/local/share/zsh/site-functions/_backlog",
			user: join(home, ".zsh/completions/_backlog"),
		},
		fish: {
			system: "/usr/share/fish/vendor_completions.d/backlog.fish",
			user: join(home, ".config/fish/completions/backlog.fish"),
		},
	};

	return paths[shell];
}

/**
 * Get instructions for enabling completions after installation
 */
function getEnableInstructions(shell: Shell, installPath: string): string {
	const instructions: Record<Shell, string> = {
		bash: `
To enable completions, add this to your ~/.bashrc:
source ${installPath}

Then restart your shell or run:
source ~/.bashrc
`,
		zsh: `
To enable completions, ensure the directory is in your fpath.
Add this to your ~/.zshrc:
fpath=(${dirname(installPath)} $fpath)
autoload -Uz compinit && compinit

Then restart your shell or run:
source ~/.zshrc
`,
		fish: `
Completions should be automatically loaded by fish.
Restart your shell or run:
exec fish
`,
		pwsh: `
To enable completions, add this to your PowerShell profile ($PROFILE.CurrentUserAllHosts):
$completionScript = Join-Path (Split-Path -Parent $PROFILE.CurrentUserAllHosts) "Completions/backlog-completion.ps1"
if (Test-Path $completionScript) { . $completionScript }

Then restart PowerShell or run:
. $PROFILE.CurrentUserAllHosts
`,
	};

	return instructions[shell];
}

/**
 * Install completion script
 */
export async function installCompletion(
	shell?: string,
	options: CompletionInstallOptions = {},
): Promise<CompletionInstallResult> {
	// Detect shell if not provided
	const targetShell = shell as Shell | undefined;
	const detectedShell = targetShell || detectShell();

	if (!detectedShell) {
		const message = [
			"Could not detect your shell.",
			"Please specify it manually:",
			"  backlog completion install --shell bash",
			"  backlog completion install --shell zsh",
			"  backlog completion install --shell fish",
			"  backlog completion install --shell pwsh",
		].join("\n");
		throw new Error(message);
	}

	if (!["bash", "zsh", "fish", "pwsh"].includes(detectedShell)) {
		throw new Error(`Unsupported shell: ${detectedShell}\nSupported shells: bash, zsh, fish, pwsh`);
	}

	const scriptContent = completionScripts[detectedShell];

	// Get installation paths
	const paths = getInstallPaths(detectedShell, options.resolvePowerShellProfilePath, options.homeDir);

	// Try user installation first (no sudo required)
	const installPath = paths.user;
	const installDir = dirname(installPath);

	try {
		// Create directory if it doesn't exist
		if (!existsSync(installDir)) {
			await mkdir(installDir, { recursive: true });
		}

		// Write the completion script
		await writeFile(installPath, scriptContent, "utf-8");
	} catch (error) {
		const scriptFilename = getScriptFilename(detectedShell);
		const manualInstructions =
			detectedShell === "pwsh"
				? [
						"Failed to install PowerShell completion script automatically.",
						"",
						`Target path: ${installPath}`,
						"",
						"Ensure the profile directory is writable and run again:",
						"  backlog completion install --shell pwsh",
						"",
						"Then add this to your PowerShell profile ($PROFILE.CurrentUserAllHosts):",
						'$completionScript = Join-Path (Split-Path -Parent $PROFILE.CurrentUserAllHosts) "Completions/backlog-completion.ps1"',
						"if (Test-Path $completionScript) { . $completionScript }",
					].join("\n")
				: [
						"Failed to install completion script automatically.",
						"",
						"Manual installation options:",
						"1. System-wide installation (requires sudo):",
						`   sudo cp completions/${scriptFilename} ${paths.system}`,
						"",
						"2. User installation:",
						`   mkdir -p ${installDir}`,
						`   cp completions/${scriptFilename} ${installPath}`,
					].join("\n");
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`${errorMessage}\n\n${manualInstructions}`);
	}

	return {
		shell: detectedShell,
		installPath,
		instructions: getEnableInstructions(detectedShell, installPath),
	};
}

/**
 * Register the completion command and subcommands
 */
export function registerCompletionCommand(program: Command): void {
	const completionCmd = program.command("completion").description("manage shell completion scripts");

	// Hidden command used by shell completion scripts
	completionCmd
		.command("__complete <line> <point>")
		.description("internal command for shell completion (do not call directly)")
		.action(async (line: string, point: string) => {
			try {
				const pointNum = Number.parseInt(point, 10);
				if (Number.isNaN(pointNum)) {
					process.exit(1);
				}

				const completions = await getCompletions(program, line, pointNum);
				for (const completion of completions) {
					console.log(completion);
				}
				process.exit(0);
			} catch (_error) {
				// Silent failure - completion should never break the shell
				process.exit(1);
			}
		});

	// Installation command
	completionCmd
		.command("install")
		.description("install shell completion script")
		.option("--shell <shell>", "shell type (bash, zsh, fish, pwsh)")
		.action(async (options: { shell?: string }) => {
			try {
				const result = await installCompletion(options.shell);
				console.log(`📦 Installed ${result.shell} completion for backlog CLI.`);
				console.log(`✅ Completion script written to ${result.installPath}`);
				console.log(result.instructions.trimEnd());
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`❌ ${message}`);
				process.exit(1);
			}
		});
}
