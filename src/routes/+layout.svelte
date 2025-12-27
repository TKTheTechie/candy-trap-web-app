<script lang="ts">
	import './layout.css';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<title>Candy Trap Alert System</title>
	<meta name="description" content="LEGO-themed security system for Cub Scouts using Solace PubSub+" />
	
	<!-- Favicon with proper base path -->
	<link rel="icon" href="{base}/favicon.ico" />
	<link rel="icon" type="image/png" sizes="32x32" href="{base}/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="{base}/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="{base}/apple-touch-icon.png" />
	<link rel="manifest" href="{base}/site.webmanifest" />
	
	<!-- Additional meta -->
	<meta name="theme-color" content="#1E3A8A" />
</svelte:head>
{@render children()}
