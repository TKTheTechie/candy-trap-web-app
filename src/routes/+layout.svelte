<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Candy Trap Alert System</title>
	<meta name="description" content="LEGO-themed security system for Cub Scouts using Solace PubSub+" />
	
	<!-- Simple favicon setup -->
	<link rel="icon" href="/favicon.ico" />
	
	<!-- Additional meta -->
	<meta name="theme-color" content="#1E3A8A" />
</svelte:head>
{@render children()}
