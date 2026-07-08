<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - RIKMS</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-white">

    <nav class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 grid place-items-center rounded-lg bg-[--navy] text-white">
                <x-icon name="document" class="w-4 h-4" />
            </div>
            <span class="font-extrabold text-[--navy] text-lg">RIKMS</span>
        </div>

        <div class="hidden md:flex items-center gap-2 w-full max-w-md h-10 px-3 rounded-xl bg-gray-100 border border-gray-100">
            <x-icon name="search" class="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search research, keywords, agencies, or SDGs" class="w-full bg-transparent outline-none text-sm text-gray-600" disabled>
        </div>

        <div class="flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#" class="hidden sm:inline hover:text-[--navy]">Browse Research</a>
            <a href="#" class="hidden sm:inline hover:text-[--navy]">Agencies</a>
            <a href="#" class="hidden sm:inline hover:text-[--navy]">About</a>
            <span class="h-10 px-5 grid place-items-center rounded-xl bg-[--navy] text-white font-bold text-sm">Login</span>
        </div>
    </nav>

    <div class="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">

        <div class="relative hidden lg:flex flex-col items-center justify-center gap-6 px-16 overflow-hidden bg-[--navy] text-white text-center">
            <div class="absolute w-72 h-72 rounded-full border border-white/10 -top-10 -right-16"></div>
            <div class="absolute w-96 h-96 rounded-full border border-white/10 -bottom-24 -left-24"></div>

            <div class="relative z-10 w-16 h-16 grid place-items-center rounded-2xl bg-white/10">
                <x-icon name="document" class="w-8 h-8" />
            </div>
            <h1 class="relative z-10 text-3xl font-extrabold leading-tight max-w-sm">
                Regionwide Integrated Knowledge Management System
            </h1>
            <p class="relative z-10 text-white/70 max-w-sm leading-relaxed">
                Discover research publications, articles, and knowledge outputs contributed by government agencies and institutions in the Davao Region.
            </p>
        </div>

        <div class="flex items-center justify-center px-6 py-12">
            <div class="w-full max-w-sm">

                <div class="flex items-center justify-center gap-3 mb-6">
                    <img src="{{ asset('images/agency-seal.png') }}" alt="" class="w-10 h-10" onerror="this.style.display='none'">
                    <div class="w-px h-8 bg-gray-200"></div>
                    <img src="{{ asset('images/rikms-mark.png') }}" alt="" class="w-10 h-10" onerror="this.style.display='none'">
                </div>

                <h2 class="text-center text-2xl font-extrabold text-[--navy]">Welcome Back</h2>
                <p class="text-center text-sm text-gray-500 mt-2 mb-6">
                    Please select your agency and enter your credentials to access the portal.
                </p>

                @error('email')
                    <div class="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{{ $message }}</div>
                @enderror

                <form method="POST" action="{{ route('login.store') }}" class="space-y-5">
                    @csrf

                    <div>
                        <label class="block text-sm font-bold text-gray-800 mb-1.5">Agency</label>
                        <div class="relative">
                            <x-icon name="building" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select name="agency_id" class="w-full h-11 pl-9 pr-8 rounded-xl border border-gray-200 text-sm text-gray-600 appearance-none outline-none focus:border-[--secondary-blue]">
                                <option value="">Select your agency</option>
                                @foreach ($agencies as $agency)
                                    <option value="{{ $agency->id }}">{{ $agency->name }}</option>
                                @endforeach
                            </select>
                            <x-icon name="chevron-down" class="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-800 mb-1.5">Email Address</label>
                        <input name="email" type="email" value="{{ old('email') }}" placeholder="admin@agency.gov.ph" required autofocus
                               class="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[--secondary-blue]">
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-800 mb-1.5">Password</label>
                        <div class="relative">
                            <input data-password-field name="password" type="password" placeholder="Enter your password" required
                                   class="w-full h-11 px-3 pr-10 rounded-xl border border-gray-200 text-sm outline-none focus:border-[--secondary-blue]">
                            <button type="button" data-password-toggle class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <x-icon name="eye" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between text-sm">
                        <label class="flex items-center gap-2 text-gray-600 font-medium">
                            <input type="checkbox" name="remember" class="rounded border-gray-300">
                            Remember Me
                        </label>
                        <a href="#" class="text-[--secondary-blue] font-medium">Forgot Password?</a>
                    </div>

                    <button type="submit" class="w-full h-12 rounded-xl bg-[--navy] text-white font-bold hover:bg-[--navy-dark] transition">
                        Sign In to Portal
                    </button>
                </form>

                <div class="mt-8 text-center text-xs text-gray-400 space-y-1">
                    <p class="flex items-center justify-center gap-1.5">
                        <x-icon name="shield" class="w-3.5 h-3.5" />
                        Secure 256-bit encrypted connection
                    </p>
                    <p>Official research management portal of the Regionwide Integrated Knowledge Management System.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>