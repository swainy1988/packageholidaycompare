// ======================================================
// PackageHolidayCompare
// Holiday Offers Manager
// ======================================================

let allOffers = [];
let hotelNames = {};

document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchOffers");

    if (searchInput) {
        searchInput.addEventListener("input", function () {

            const search = this.value.trim().toLowerCase();

            const filteredOffers = allOffers.filter(offer => {

                const hotelName =
                    hotelNames[offer.hotel_id] || "";

                return (
                    hotelName.toLowerCase().includes(search) ||
                    (offer.supplier || "").toLowerCase().includes(search) ||
                    (offer.airport || "").toLowerCase().includes(search)
                );

            });

            renderOffers(filteredOffers);

        });
    }

    loadOffers();

});

async function loadOffers() {

    const table = document.getElementById("offersTable");

    if (!table) {
        console.error("offersTable element was not found.");
        return;
    }

    if (!window.db) {

        console.error("Supabase is not connected.");

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Supabase connection is unavailable.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="7">
                Loading offers...
            </td>
        </tr>
    `;

    try {

        // Load hotel names separately.
        const { data: hotels, error: hotelError } =
            await window.db
                .from("hotels")
                .select("id, name");

        if (hotelError) {
            throw hotelError;
        }

        hotelNames = {};

        (hotels || []).forEach(hotel => {
            hotelNames[hotel.id] = hotel.name;
        });

        // Load holiday offers.
        const { data: offers, error: offerError } =
            await window.db
                .from("holiday_offers")
                .select("*")
                .order("departure_date", {
                    ascending: true
                });

        if (offerError) {
            throw offerError;
        }

        allOffers = offers || [];

        renderOffers(allOffers);

    } catch (error) {

        console.error("Failed to load offers:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Failed to load offers.
                </td>
            </tr>
        `;

    }

}

function renderOffers(offers) {

    const table = document.getElementById("offersTable");

    table.innerHTML = "";

    if (!offers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No holiday offers found.
                </td>
            </tr>
        `;

        return;
    }

    offers.forEach(offer => {

        const hotelName =
            hotelNames[offer.hotel_id] || "Unknown hotel";

        const price = Number(offer.price || 0)
            .toLocaleString("en-GB", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });

        table.insertAdjacentHTML("beforeend", `
            <tr>

                <td>
                    ${escapeHtml(hotelName)}
                </td>

                <td>
                    ${escapeHtml(offer.supplier || "-")}
                </td>

                <td>
                    £${price}
                </td>

                <td>
                    ${formatDate(offer.departure_date)}
                </td>

                <td>
                    ${escapeHtml(offer.airport || "-")}
                </td>

                <td>
                    ${offer.nights ?? "-"}
                </td>

                <td>

                    <a
                        class="btn btn-small"
                        href="edit-offer.html?id=${encodeURIComponent(offer.id)}"
                    >
                        Edit
                    </a>

                    <button
                        type="button"
                        class="btn btn-red btn-small"
                        onclick="deleteOffer('${offer.id}')"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `);

    });

}

async function deleteOffer(id) {

    const confirmed =
        confirm("Are you sure you want to delete this holiday offer?");

    if (!confirmed) {
        return;
    }

    const { error } = await window.db
        .from("holiday_offers")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);
        alert("The offer could not be deleted.");

        return;
    }

    await loadOffers();

}

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}