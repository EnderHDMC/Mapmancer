<script lang="ts">
	import { onMount } from 'svelte';
	import { createGame } from '$lib/scene';
	import '$lib/disableF1';

	let game: HTMLCanvasElement;

	onMount(() => {
		game.focus();
		createGame(game);
		game.focus();
	});
</script>

<svelte:head>
	<title>Dungeon Crawler</title>
	<meta name="description" content="Kaboom app built with Svelte" />
</svelte:head>

<div class="game-page">
	<!-- svelte-ignore a11y-autofocus -->
	<canvas bind:this={game} autofocus />
</div>

<style>
	.game-page {
		background-color: mediumturquoise;
		height: 100vh;
	}
</style>
