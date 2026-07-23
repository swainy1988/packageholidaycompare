// ======================================================
// PackageHolidayCompare Dashboard
// ======================================================

async function loadDashboard() {

    try {

        // -----------------------------
        // Hotels Count
        // -----------------------------
        const { count: hotelCount, error: hotelError } = await db
            .from("hotels")
            .select("*", { count: "exact", head: true });

        if (hotelError) throw hotelError;

        document.getElementById("hotelCount").textContent =
            hotelCount || 0;

        // -----------------------------
        // Holiday Deals
        // -----------------------------
        const { data: holidays, error: holidayError } = await db
            .from("holidays")
            .select("*")
            .order("name", { ascending: true });

        if (holidayError) throw holidayError;

        document.getElementById("holidayCount").textContent =
            holidays.length;

        // -----------------------------
        // Countries
        // -----------------------------
        const countries = [
            ...new Set(
                holidays
                    .map(h => h.country)
                    .filter(Boolean)
            )
        ];

        document.getElementById("countryCount").textContent =
            countries.length;

        // -----------------------------
        // Average Rating
        // -----------------------------
        const ratings = holidays
            .map(h => Number(h.rating))
            .filter(r => !isNaN(r));

        const averageRating = ratings.length
            ? (
                ratings.reduce((a, b) => a + b, 0) /
                ratings.length
            ).toFixed(1)
            : "0.0";

        document.getElementById("ratingAverage").textContent =
            averageRating;

        // -----------------------------
        // Recent Holiday Deals
        // -----------------------------
        const table = document.getElementById("recentHotels");

        table.innerHTML = "";

        holidays.slice(0, 8).forEach(hotel => {

            table.innerHTML += `
                <tr>
                    <td>${hotel.name || ""}</td>
                    <td>${hotel.country || ""}</td>
                    <td>${"★".repeat(Number(hotel.stars) || 0)}</td>
                    <td>${hotel.rating || "-"}</td>
                </tr>
            `;

        });

    } catch (err) {

        console.error(err);

        alert("Dashboard failed to load. Check the browser console.");

    }

}

document.addEventListener("DOMContentLoaded", loadDashboard);