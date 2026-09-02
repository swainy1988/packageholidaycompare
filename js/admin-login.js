// ======================================================
// PackageHolidayCompare
// Admin Login
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseAdminLogin
);


// ======================================================
// INITIALISE
// ======================================================

async function initialiseAdminLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        handleAdminLogin
    );

    // If already signed in as an admin,
    // send straight to the dashboard.
    await checkExistingAdminSession();

}


// ======================================================
// CHECK EXISTING SESSION
// ======================================================

async function checkExistingAdminSession() {

    if (!window.db) {
        return;
    }

    try {

        const {
            data: sessionData,
            error: sessionError
        } = await window.db.auth.getSession();

        if (sessionError) {

            console.error(
                "Session check failed:",
                sessionError
            );

            return;
        }

        const session =
            sessionData?.session;

        if (!session) {
            return;
        }

        const isAdmin =
            await checkAdminPermission();

        if (isAdmin) {

            window.location.href =
                "index.html";

        } else {

            await window.db.auth.signOut();

        }

    } catch (error) {

        console.error(
            "Admin session check failed:",
            error
        );

    }

}


// ======================================================
// LOGIN
// ======================================================

async function handleAdminLogin(event) {

    event.preventDefault();

    if (!window.db) {

        showLoginMessage(
            "Supabase is not connected.",
            true
        );

        return;

    }

    const emailInput =
        document.getElementById(
            "email"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const button =
        document.getElementById(
            "loginButton"
        );

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (
        !email ||
        !password
    ) {

        showLoginMessage(
            "Please enter your email address and password.",
            true
        );

        return;

    }

    button.disabled = true;

    button.textContent =
        "Signing in...";

    showLoginMessage(
        "",
        false
    );

    try {

        // ==================================================
        // SIGN INTO SUPABASE
        // ==================================================

        const {
            data,
            error
        } = await window.db.auth
            .signInWithPassword({

                email:
                    email,

                password:
                    password

            });

        if (error) {
            throw error;
        }

        if (!data?.user) {

            throw new Error(
                "Login was unsuccessful."
            );

        }


        // ==================================================
        // CHECK ADMIN PERMISSION
        // ==================================================

        const isAdmin =
            await checkAdminPermission();

        if (!isAdmin) {

            await window.db.auth.signOut();

            showLoginMessage(
                "This account does not have admin access.",
                true
            );

            button.disabled = false;

            button.textContent =
                "Sign In";

            return;

        }


        // ==================================================
        // LOGIN SUCCESS
        // ==================================================

        showLoginMessage(
            "Login successful. Opening dashboard...",
            false
        );

        setTimeout(
            () => {

                window.location.href =
                    "index.html";

            },
            600
        );

    } catch (error) {

        console.error(
            "Admin login failed:",
            error
        );

        showLoginMessage(
            createFriendlyLoginError(
                error
            ),
            true
        );

        button.disabled = false;

        button.textContent =
            "Sign In";

    }

}


// ======================================================
// ADMIN PERMISSION CHECK
// ======================================================

async function checkAdminPermission() {

    if (!window.db) {
        return false;
    }

    const {
        data,
        error
    } = await window.db.rpc(
        "is_admin"
    );

    if (error) {

        console.error(
            "Admin permission check failed:",
            error
        );

        return false;

    }

    return data === true;

}


// ======================================================
// FRIENDLY ERROR MESSAGE
// ======================================================

function createFriendlyLoginError(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();

    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email address or password.";

    }

    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Your email address has not been confirmed.";

    }

    return (
        error?.message ||
        "Unable to sign in. Please try again."
    );

}


// ======================================================
// LOGIN MESSAGE
// ======================================================

function showLoginMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "loginMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.classList.remove(
        "error",
        "success"
    );

    if (!text) {

        message.style.display =
            "none";

        return;

    }

    message.style.display =
        "block";

    message.classList.add(
        isError
            ? "error"
            : "success"
    );

}