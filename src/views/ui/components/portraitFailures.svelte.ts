// portraitFailures.svelte.ts — 못 불러온 구운 초상화 주소 (화면 전체 공유, 저장 안 함). 그 주소만 벡터 초상화로 대신한다
import { SvelteSet } from "svelte/reactivity";

export const failedPortraits = new SvelteSet<string>();
