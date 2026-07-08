<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>RIKMS-copy</title>
    <script>
        window.__RIKMS_BOOTSTRAP__ = @json($bootstrap, JSON_UNESCAPED_SLASHES);
    </script>
    @vite('resources/js/main.tsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
