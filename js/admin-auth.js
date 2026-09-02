// ======================================================
// PackageHolidayCompare
// Admin Authentication Guard
// ======================================================

(function () {

    // Hide the admin page while access is being checked.
    document.documentElement.style.visibility =
        "hidden";

    checkAdminAccess();

})();


// ======================================================
// CHECK ADMIN ACCESS
// ======================================================

async function checkAdminAccess() {

    if (!window.db) {

        redirectToLogin();
        return;

    }

    try {

        // Check for a signed-in Supabase session.
        const {
            data: sessionData,
            error: sessionError
        } = await window.db.auth.getSession();

        if (sessionError) {

            console.error(
                "Admin session check failed:",
                sessionError
            );

            redirectToLogin();
            return;
        }

        const session =
            sessionData?.session;

        if (!session) {

            redirectToLogin();
            return;
        }


        // Check that the signed-in user is in admin_users.
        const {
            data: isAdmin,
            error: adminError
        } = await window.db.rpc(
            "is_admin"
        );

        if (
            adminError ||
            isAdmin !== true
        ) {

            console.error(
                "Admin permission check failed:",
                adminError
            );

            await window.db.auth.signOut();

            redirectToLogin();
            return;
        }


        // Access approved.
        document.documentElement.style.visibility =
            "visible";

    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        redirectToLogin();

    }

}


// ======================================================
// REDIRECT TO LOGIN
// ======================================================

function redirectToLogin() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    if (currentPage === "login.html") {

        document.documentElement.style.visibility =
            "visible";

        return;
    }

    window.location.replace(
        "login.html"
    );

}


// ======================================================
// LOGOUT
// ======================================================

async function adminLogout() {

    if (window.db) {

        await window.db.auth.signOut();

    }

    window.location.replace(
        "login.html"
    );

}


// Make logout available to admin pages.
window.adminLogout =
    adminLogout;