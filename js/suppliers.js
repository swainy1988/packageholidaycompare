// ======================================================
// PackageHolidayCompare
// Suppliers Manager
// ======================================================

let allSuppliers = [];

document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("searchSuppliers");

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                const search =
                    this.value
                        .trim()
                        .toLowerCase();

                const filteredSuppliers =
                    allSuppliers.filter(
                        supplier => {

                            const name =
                                supplier.name || "";

                            const slug =
                                supplier.slug || "";

                            const website =
                                supplier.website_url || "";

                            return (
                                name
                                    .toLowerCase()
                                    .includes(search) ||

                                slug
                                    .toLowerCase()
                                    .includes(search) ||

                                website
                                    .toLowerCase()
                                    .includes(search)
                            );

                        }
                    );

                renderSuppliers(
                    filteredSuppliers
                );

            }
        );

    }

    loadSuppliers();

});


// ======================================================
// LOAD SUPPLIERS
// ======================================================

async function loadSuppliers() {

    const table =
        document.getElementById(
            "suppliersTable"
        );

    if (!table) {

        console.error(
            "The suppliersTable element was not found."
        );

        return;

    }

    if (!window.db) {

        console.error(
            "Supabase is not connected."
        );

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Supabase connection is unavailable.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = `
        <tr>
            <td colspan="6">
                Loading suppliers...
            </td>
        </tr>
    `;

    try {

        const {
            data: suppliers,
            error
        } = await window.db
            .from("suppliers")
            .select("*")
            .order(
                "name",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        allSuppliers =
            suppliers || [];

        renderSuppliers(
            allSuppliers
        );

    } catch (error) {

        console.error(
            "Failed to load suppliers:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load suppliers.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// RENDER SUPPLIERS
// ======================================================

function renderSuppliers(suppliers) {

    const table =
        document.getElementById(
            "suppliersTable"
        );

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (!suppliers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No suppliers found.
                </td>
            </tr>
        `;

        return;

    }

    suppliers.forEach(
        supplier => {

            // ==================================================
            // LOGO
            // ==================================================

            const logoUrl =
                createSafeUrl(
                    supplier.logo_url
                );

            const logoDisplay =
                logoUrl
                    ? `
                        <div
                            style="
                                width:90px;
                                min-height:50px;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                padding:6px;
                                border:1px solid #e5e7eb;
                                border-radius:8px;
                                background:#ffffff;
                            "
                        >
                            <img
                                src="${logoUrl}"
                                alt="${escapeAttribute(
                                    supplier.name ||
                                    "Supplier"
                                )} logo"
                                style="
                                    max-width:78px;
                                    max-height:40px;
                                    width:auto;
                                    height:auto;
                                    object-fit:contain;
                                "
                                onerror="this.parentElement.innerHTML='<span style=&quot;color:#777;font-size:12px;&quot;>Logo unavailable</span>'"
                            >
                        </div>
                    `
                    : `
                        <span
                            style="
                                color:#777;
                                font-size:13px;
                            "
                        >
                            No logo
                        </span>
                    `;


            // ==================================================
            // WEBSITE
            // ==================================================

            const websiteUrl =
                createSafeUrl(
                    supplier.website_url
                );

            const websiteDisplay =
                websiteUrl
                    ? `
                        <a
                            href="${websiteUrl}"
                            target="_blank"
                            rel="noopener"
                        >
                            Visit Website
                        </a>
                    `
                    : `
                        <span
                            style="
                                color:#777;
                                font-size:13px;
                            "
                        >
                            No website
                        </span>
                    `;


            // ==================================================
            // STATUS
            // ==================================================

            const status =
                supplier.active
                    ? `
                        <span
                            style="
                                display:inline-block;
                                padding:5px 9px;
                                border-radius:999px;
                                background:#e8f7ee;
                                color:#16834a;
                                font-size:12px;
                                font-weight:700;
                            "
                        >
                            Active
                        </span>
                    `
                    : `
                        <span
                            style="
                                display:inline-block;
                                padding:5px 9px;
                                border-radius:999px;
                                background:#f1f1f1;
                                color:#666;
                                font-size:12px;
                                font-weight:700;
                            "
                        >
                            Inactive
                        </span>
                    `;


            // ==================================================
            // TABLE ROW
            // ==================================================

            table.insertAdjacentHTML(
                "beforeend",
                `
                    <tr>

                        <td>
                            ${logoDisplay}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    supplier.name ||
                                    "Unnamed supplier"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                supplier.slug ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${websiteDisplay}
                        </td>

                        <td>
                            ${status}
                        </td>

                        <td>

                            <a
                                class="btn btn-small"
                                href="edit-supplier.html?id=${encodeURIComponent(
                                    supplier.id
                                )}"
                            >
                                Edit
                            </a>

                            <button
                                type="button"
                                class="btn-red"
                                onclick="deleteSupplier('${escapeAttribute(
                                    supplier.id
                                )}')"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>
                `
            );

        }
    );

}


// ======================================================
// DELETE SUPPLIER
// ======================================================

async function deleteSupplier(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this supplier?"
        );

    if (!confirmed) {
        return;
    }

    if (!window.db) {

        alert(
            "Supabase is not connected."
        );

        return;

    }

    const {
        error
    } = await window.db
        .from("suppliers")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(
            "Failed to delete supplier:",
            error
        );

        alert(
            "The supplier could not be deleted."
        );

        return;

    }

    await loadSuppliers();

}


// ======================================================
// URL SAFETY
// ======================================================

function createSafeUrl(value) {

    const url =
        String(
            value || ""
        ).trim();

    if (
        url.startsWith("https://") ||
        url.startsWith("http://")
    ) {

        return escapeAttribute(
            url
        );

    }

    return "";

}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}