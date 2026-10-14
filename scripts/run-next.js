const { spawn } = require("node:child_process");

const args = process.argv.slice(2);

if (process.env.NODE_EXTRA_CA_CERTS) {
	delete process.env.NODE_EXTRA_CA_CERTS;
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, ...args], {
	stdio: "inherit",
	env: process.env,
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 0);
});

child.on("error", (error) => {
	console.error(error);
	process.exit(1);
});
