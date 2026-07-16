<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="Regional Innovation and Knowledge Management System research repository">
    <meta name="theme-color" content="#1E3A8A">
    <title>{{ config('app.name', 'RIKMS') }}</title>
    @viteReactRefresh
    @vite('resources/js/main.tsx')
</head>
<body>
    <div id="root"><noscript>RIKMS requires JavaScript to run this application.</noscript></div>
</body>
</html>
