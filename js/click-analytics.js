// ======================================================
// PackageHolidayCompare
// Admin Click Analytics
// Version: 2026-10-20-2
// ======================================================

let allDealClicks = [];
let filteredDealClicks = [];
let hotelNames = {};


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseClickAnalytics
);


// ======================================================
// INITIALISE
// ======================================================

async function initialiseClickAnalytics() {

    if (!window.db) {

        showAnalyticsError(
            "Supabase is not connected."
        );

        return;
    }


    try {

        const session =
            await waitForAdminSession();


        if (!session) {

            showAnalyticsError(
                "Your admin session could not be confirmed."
            );

            return;
        }


        attachDateFilter();


        await loadHotels();

        await loadDealClicks();


        applyDateFilter();


        setAnalyticsMessage(
            `Analytics updated ${formatDateTime(
                new Date().toISOString()
            )}.`
        );

    } catch (error) {

        console.error(
            "Click analytics failed:",
            error
        );


        showAnalyticsError(
            error?.message ||
            "Click analytics could not be loaded."
        );

    }

}


// ======================================================
// DATE FILTER EVENT
// ======================================================

function attachDateFilter() {

    const filter =
        document.getElementById(
            "dateRangeFilter"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        applyDateFilter
    );

}


// ======================================================
// APPLY DATE FILTER
// ======================================================

function applyDateFilter() {

    const filter =
        document.getElementById(
            "dateRangeFilter"
        );


    const selectedRange =
        filter
            ? filter.value
            : "all";


    filteredDealClicks =
        allDealClicks.filter(
            click =>
                clickMatchesDateRange(
                    click.clicked_at,
                    selectedRange
                )
        );


    updateDateRangeText(
        selectedRange
    );


    updateTotalClicksLabel(
        selectedRange
    );


    renderSummaryCards();

    renderSupplierStats();

    renderRecentClicks();

}


// ======================================================
// CLICK MATCHES DATE RANGE
// ======================================================

function clickMatchesDateRange(
    dateValue,
    range
) {

    if (
        range === "all"
    ) {
        return true;
    }


    if (!dateValue) {
        return false;
    }


    const clickDate =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            clickDate.getTime()
        )
    ) {
        return false;
    }


    const now =
        new Date();


    const start =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    if (
        range === "today"
    ) {

        return (
            clickDate >= start &&
            clickDate <= now
        );

    }


    const days =
        Number(
            range
        );


    if (
        !Number.isFinite(days) ||
        days < 1
    ) {
        return true;
    }


    start.setDate(
        start.getDate() -
        (days - 1)
    );


    return (
        clickDate >= start &&
        clickDate <= now
    );

}


// ======================================================
// DATE RANGE TEXT
// ======================================================

function updateDateRangeText(
    range
) {

    const element =
        document.getElementById(
            "activeDateRangeText"
        );


    if (!element) {
        return;
    }


    if (
        range === "today"
    ) {

        element.textContent =
            "Showing deal clicks recorded today.";

        return;

    }


    if (
        range === "7"
    ) {

        element.textContent =
            "Showing deal clicks from the last 7 days.";

        return;

    }


    if (
        range === "30"
    ) {

        element.textContent =
            "Showing deal clicks from the last 30 days.";

        return;

    }


    element.textContent =
        "Showing all recorded deal clicks.";

}


// ======================================================
// TOTAL CARD LABEL
// ======================================================

function updateTotalClicksLabel(
    range
) {

    const element =
        document.getElementById(
            "totalClicksLabel"
        );


    if (!element) {
        return;
    }


    if (
        range === "today"
    ) {

        element.textContent =
            "Deal Clicks Today";

        return;

    }


    if (
        range === "7"
    ) {

        element.textContent =
            "Deal Clicks - Last 7 Days";

        return;

    }


    if (
        range === "30"
    ) {

        element.textContent =
            "Deal Clicks - Last 30 Days";

        return;

    }


    element.textContent =
        "Total Deal Clicks";

}


// ======================================================
// WAIT FOR ADMIN SESSION
// ======================================================

async function waitForAdminSession() {

    for (
        let attempt = 0;
        attempt < 10;
        attempt++
    ) {

        const {
            data,
            error
        } =
            await window.db.auth.getSession();


        if (error) {

            console.error(
                "Could not read admin session:",
                error
            );

            return null;

        }


        if (
            data?.session
        ) {

            return data.session;

        }


        await delay(
            150
        );

    }


    return null;

}


// ======================================================
// SMALL DELAY
// ======================================================

function delay(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

    hotelNames = {};


    const {
        data,
        error
    } =
        await window.db
            .from("hotels")
            .select("id, name")
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.warn(
            "Hotel names could not be loaded:",
            error
        );

        return;

    }


    (
        data || []
    ).forEach(
        hotel => {

            if (
                hotel?.id
            ) {

                hotelNames[
                    String(
                        hotel.id
                    )
                ] =
                    hotel.name ||
                    "Unknown hotel";

            }

        }
    );

}


// ======================================================
// LOAD ALL DEAL CLICKS
// ======================================================

async function loadDealClicks() {

    allDealClicks = [];


    const pageSize =
        1000;


    let from =
        0;


    while (true) {

        const to =
            from +
            pageSize -
            1;


        const {
            data,
            error
        } =
            await window.db
                .from("deal_clicks")
                .select(`
                    id,
                    offer_id,
                    hotel_id,
                    supplier,
                    source_page,
                    clicked_at
                `)
                .order(
                    "clicked_at",
                    {
                        ascending: false
                    }
                )
                .range(
                    from,
                    to
                );


        if (error) {
            throw error;
        }


        const rows =
            Array.isArray(data)
                ? data
                : [];


        allDealClicks.push(
            ...rows
        );


        if (
            rows.length <
            pageSize
        ) {
            break;
        }


        from +=
            pageSize;

    }

}


// ======================================================
// SUMMARY CARDS
// ======================================================

function renderSummaryCards() {

    const totalClicks =
        filteredDealClicks.length;


    const todayClicks =
        allDealClicks.filter(
            click =>
                isToday(
                    click.clicked_at
                )
        ).length;


    const resultsClicks =
        filteredDealClicks.filter(
            click =>
                click.source_page ===
                "results"
        ).length;


    const hotelClicks =
        filteredDealClicks.filter(
            click =>
                click.source_page ===
                "hotel"
        ).length;


    setText(
        "totalClicks",
        formatNumber(
            totalClicks
        )
    );


    setText(
        "todayClicks",
        formatNumber(
            todayClicks
        )
    );


    setText(
        "resultsClicks",
        formatNumber(
            resultsClicks
        )
    );


    setText(
        "hotelClicks",
        formatNumber(
            hotelClicks
        )
    );

}


// ======================================================
// SUPPLIER STATS
// ======================================================

function renderSupplierStats() {

    const table =
        document.getElementById(
            "supplierStatsBody"
        );


    if (!table) {
        return;
    }


    table.innerHTML =
        "";


    if (
        filteredDealClicks.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            4;


        cell.textContent =
            "No deal clicks were recorded in this date range.";


        row.appendChild(
            cell
        );


        table.appendChild(
            row
        );


        return;

    }


    const stats =
        {};


    filteredDealClicks.forEach(
        click => {

            const supplier =
                String(
                    click.supplier ||
                    "Unknown supplier"
                ).trim();


            if (
                !stats[supplier]
            ) {

                stats[supplier] = {

                    supplier,

                    total:
                        0,

                    results:
                        0,

                    hotel:
                        0

                };

            }


            stats[supplier].total++;


            if (
                click.source_page ===
                "results"
            ) {

                stats[supplier]
                    .results++;

            }


            if (
                click.source_page ===
                "hotel"
            ) {

                stats[supplier]
                    .hotel++;

            }

        }
    );


    const supplierStats =
        Object
            .values(
                stats
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    second.total -
                    first.total
            );


    supplierStats.forEach(
        supplier => {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                supplier.supplier,
                true
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.total
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.results
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.hotel
                )
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// RECENT CLICKS
// ======================================================

function renderRecentClicks() {

    const table =
        document.getElementById(
            "recentClicksBody"
        );


    if (!table) {
        return;
    }


    table.innerHTML =
        "";


    if (
        filteredDealClicks.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            4;


        cell.textContent =
            "No deal clicks were recorded in this date range.";


        row.appendChild(
            cell
        );


        table.appendChild(
            row
        );


        return;

    }


    const recentClicks =
        filteredDealClicks.slice(
            0,
            50
        );


    recentClicks.forEach(
        click => {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                click.supplier ||
                "Unknown supplier",
                true
            );


            const sourceCell =
                document.createElement(
                    "td"
                );


            const sourceBadge =
                document.createElement(
                    "span"
                );


            sourceBadge.className =
                "source-badge";


            sourceBadge.textContent =
                formatSourcePage(
                    click.source_page
                );


            sourceCell.appendChild(
                sourceBadge
            );


            row.appendChild(
                sourceCell
            );


            const hotelName =
                click.hotel_id
                    ? hotelNames[
                        String(
                            click.hotel_id
                        )
                    ] ||
                    "Unknown hotel"
                    : "Hotel removed";


            appendTextCell(
                row,
                hotelName
            );


            appendTextCell(
                row,
                formatDateTime(
                    click.clicked_at
                )
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// SOURCE LABEL
// ======================================================

function formatSourcePage(
    source
) {

    if (
        source ===
        "results"
    ) {

        return "Results";

    }


    if (
        source ===
        "hotel"
    ) {

        return "Hotel";

    }


    return source ||
        "Unknown";

}


// ======================================================
// TODAY CHECK
// ======================================================

function isToday(
    dateValue
) {

    if (!dateValue) {
        return false;
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return false;
    }


    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );

}


// ======================================================
// FORMAT DATE AND TIME
// ======================================================

function formatDateTime(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit"

        }
    ).format(
        date
    );

}


// ======================================================
// FORMAT NUMBER
// ======================================================

function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "en-GB"
    ).format(
        Number(
            value
        ) || 0
    );

}


// ======================================================
// TABLE CELL
// ======================================================

function appendTextCell(
    row,
    value,
    strong = false
) {

    const cell =
        document.createElement(
            "td"
        );


    if (
        strong
    ) {

        const text =
            document.createElement(
                "strong"
            );


        text.textContent =
            value;


        cell.appendChild(
            text
        );

    } else {

        cell.textContent =
            value;

    }


    row.appendChild(
        cell
    );

}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value;

}


// ======================================================
// STATUS MESSAGE
// ======================================================

function setAnalyticsMessage(
    message
) {

    const element =
        document.getElementById(
            "analyticsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

}


// ======================================================
// ERROR
// ======================================================

function showAnalyticsError(
    message
) {

    console.error(
        message
    );


    setAnalyticsMessage(
        message
    );


    const supplierTable =
        document.getElementById(
            "supplierStatsBody"
        );


    const recentTable =
        document.getElementById(
            "recentClicksBody"
        );


    if (
        supplierTable
    ) {

        supplierTable.innerHTML = `

            <tr>

                <td colspan="4">
                    Analytics could not be loaded.
                </td>

            </tr>

        `;

    }


    if (
        recentTable
    ) {

        recentTable.innerHTML = `

            <tr>

                <td colspan="4">
                    Analytics could not be loaded.
                </td>

            </tr>

        `;

    }

}