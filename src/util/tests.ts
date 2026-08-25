/** Testing utilities for data-driven test patterns - types only, no vitest dependencies */
import { relative } from 'path'

/** Converts __filename (e.g. '/path/to/project/src/engine/engine.test.ts') to 'src/engine/engine' */
export const toModule = (filename: string): string => {
	return relative(process.cwd(), filename)
		.replace(/\.test\.[tj]s$/, '')
}

export type TestCase<I = unknown, O = unknown> = {
	desc: string;
	input: I
} & (
	| { expected: O; throws?: never }
	| { throws: string; expected?: never }
)

export type FnTestCase<Fn extends (...args: unknown[]) => unknown> =
	Parameters<Fn> extends [infer SingleArg] | [infer SingleArg | undefined]
		? TestCase<SingleArg, ReturnType<Fn>>
		: TestCase<Parameters<Fn>, ReturnType<Fn>>

export type FnSingleTestCase<Fn extends (...args: unknown[]) => unknown> =
	TestCase<Parameters<Fn>[0], ReturnType<Fn>>
