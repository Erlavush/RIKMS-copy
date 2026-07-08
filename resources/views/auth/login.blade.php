<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - RIKMS</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div class="login-shell">

        <nav class="login-topbar">
            <div class="brand-row login-brand">
                <div class="brand-mark">R</div>
                <div class="brand-name">RIKMS</div>
            </div>
            <div class="login-topbar-search">
                <x-icon name="search" />
                <span>Search research, keywords, agencies, or SDGs</span>
            </div>
            <div class="login-topbar-links">
                <a href="#">Browse Research</a>
                <a href="#">Agencies</a>
                <a href="#">About</a>
                <a href="{{ route('login') }}" class="btn-primary small">Login</a>
            </div>
        </nav>

        <div class="login-split">
            <div class="login-hero">
                <div class="login-hero-circle c1"></div>
                <div class="login-hero-circle c2"></div>
                <div class="login-hero-icon"><x-icon name="document" /></div>
                <h1>Regionwide Integrated Knowledge Management System</h1>
                <p>Discover research publications, articles, and knowledge outputs contributed by government agencies and institutions in the Davao Region.</p>
            </div>

            <div class="login-panel">
                <div class="login-panel-inner">

                    <div class="login-seals">
                        <img src="{{ asset('images/agency-seal.png') }}" alt="" onerror="this.style.display='none'">
                        <div class="divider"></div>
                        <img src="{{ asset('images/rikms-mark.png') }}" alt="" onerror="this.style.display='none'">
                    </div>

                    <h2>Welcome Back</h2>
                    <p class="login-lead">Please select your agency and enter your credentials to access the portal.</p>

                    @error('email')
                        <div class="field-error" style="margin-bottom: 16px;">{{ $message }}</div>
                    @enderror

                    <form method="POST" action="{{ route('login.store') }}">
                        @csrf

                        <div class="field-block">
                            <span>Agency</span>
                            <div class="select-with-icon">
                                <span class="icon-left"><x-icon name="building" /></span>
                                <select name="agency_id">
                                    <option value="">Select your agency</option>
                                    @foreach ($agencies as $agency)
                                        <option value="{{ $agency->id }}">{{ $agency->name }}</option>
                                    @endforeach
                                </select>
                                <span class="icon-right"><x-icon name="chevron-down" /></span>
                            </div>
                        </div>

                        <div class="field-block">
                            <span>Email Address</span>
                            <input name="email" type="email" value="{{ old('email') }}" placeholder="admin@agency.gov.ph" required autofocus>
                        </div>

                        <div class="field-block">
                            <span>Password</span>
                            <div class="password-field">
                                <input data-password-field name="password" type="password" placeholder="Enter your password" required>
                                <button type="button" data-password-toggle class="password-toggle"><x-icon name="eye" /></button>
                            </div>
                        </div>

                        <div class="login-row">
                            <label><input type="checkbox" name="remember"> Remember Me</label>
                            <a href="#">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn-primary login-submit">Sign In to Portal</button>
                    </form>

                    <div class="login-footer">
                        <p class="lock-row"><x-icon name="shield" /> Secure 256-bit encrypted connection</p>
                        <p>Official research management portal of the Regionwide Integrated Knowledge Management System.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>