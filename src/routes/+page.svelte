<script lang="ts">
	import { onMount } from 'svelte';
	import { createGame } from '$lib/scene';
	import '$lib/disableF1';

	let game: HTMLCanvasElement;

	onMount(() => {
		createGame(game);
	});
</script>

<svelte:head>
	<title>Three.js Sveltekit</title>
	<meta name="description" content="Three.js example app built with Svelte" />
</svelte:head>

<div class="game-page">
	<canvas bind:this={game} />
</div>

<style>
	.game-page {
		background-color: mediumturquoise;
		height: 100vh;
	}
</style>
