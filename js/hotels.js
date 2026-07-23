// ======================================================
// PackageHolidayCompare
// Hotels Manager V2
// ======================================================

let hotels = [];

async function loadHotels() {

    if (!window.db) {
        console.error("Supabase (db) is not available.");
        return;
    }

    const tbody = document.getElementById("hotelTable");

    if (!tbody) {
        console.error("hotelTable not found.");
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6">Loading hotels...</td>
        </tr>
    `;

    const { data, error } = await window.db
        .from("hotels")
        .select("*")
        .order("name", { ascending: true });

    if (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load hotels.</td>
            </tr>
        `;

        return;

    }

    hotels = data;

    renderHotels(hotels);

}

function renderHotels(list) {

    const tbody = document.getElementById("hotelTable");

    tbody.innerHTML = "";

    if (list.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">No hotels found.</td>
            </tr>
        `;

        return;

    }

    list.forEach(hotel => {

        tbody.innerHTML += `
            <tr>

                <td>${hotel.name || ""}</td>

                <td>${hotel.country || ""}</td>

                <td>${hotel.destination || ""}</td>

                <td>${"★".repeat(Number(hotel.stars) || 0)}</td>

                <td>${hotel.rating ?? "-"}</td>

                <td>

                    <button class="btn btn-small"
                        onclick="editHotel('${hotel.id}')">
                        Edit
                    </button>

                    <button class="btn btn-danger btn-small"
                        onclick="deleteHotel('${hotel.id}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });

}

function editHotel(id) {

    window.location.href =
        "edit-hotel.html?id=" + id;

}

async function deleteHotel(id) {

    if (!confirm("Delete this hotel?"))
        return;

    const { error } = await window.db
        .from("hotels")
        .delete()
        .eq("id", id);

    if (error) {

        alert(error.message);

        return;

    }

    loadHotels();

}

document.addEventListener("DOMContentLoaded", () => {

    const search = document.getElementById("searchHotel");

    if (search) {

        search.addEventListener("input", function () {

            const value = this.value.toLowerCase();

            const filtered = hotels.filter(h =>

                (h.name || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (h.country || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (h.destination || "")
                    .toLowerCase()
                    .includes(value)

            );

            renderHotels(filtered);

        });

    }

    loadHotels();

});