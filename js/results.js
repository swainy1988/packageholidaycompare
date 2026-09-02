// ======================================================
// PackageHolidayCompare
// Public Holiday Results Page
// Version: 2026-09-02-1
// ======================================================

let allHotels = [];
let allOffers = [];
let groupedResults = [];
let visibleResults = [];

let resultsMode = "matches";

// Keep this true while offers are manually entered test data.
// Change it to false after approved live supplier feeds are connected.
const DEMO_MODE = true;

// Main search flexibility.
const PRIMARY_DATE_FLEX_DAYS = 3;
const PRIMARY_NIGHT_FLEX = 3;

// Alternative search flexibility.
const ALTERNATIVE_DATE_FLEX_DAYS = 14;
const ALTERNATIVE_NIGHT_FLEX = 7;

document.addEventListener(
    "DOMContentLoaded",
    initialiseResultsPage
);


// ======================================================
// INITIALISE PAGE
// ======================================================

async function initialiseResultsPage() {

    if (!window.db) {

        showResultsMessage(
            "Database connection error",
            "The holiday database could not be loaded."
        );

        return;
    }

    injectResultEnhancementStyles();
    setMinimumSearchDates();
    restoreSearchForm();
    createSearchChildAgeFields();
    updateSearchDuration();
    syncMaximumPriceFilter();
    attachEventListeners();
    updateSearchSummary();
    showDemoModeNotice();

    await loadHolidayResults();
}


// ======================================================
// EVENT LISTENERS
// ======================================================

function attachEventListeners() {

    const refineForm =
        document.getElementById(
            "refineSearchForm"
        );

    const childrenSelect =
        document.getElementById(
            "searchChildren"
        );

    const departureDate =
        document.getElementById(
            "searchDepartureDate"
        );

    const returnDate =
        document.getElementById(
            "searchReturnDate"
        );

    const applyFiltersButton =
        document.getElementById(
            "applyFiltersButton"
        );

    const clearFiltersButton =
        document.getElementById(
            "clearFiltersButton"
        );

    const resetSearchButton =
        document.getElementById(
            "resetSearchButton"
        );

    const sortResults =
        document.getElementById(
            "sortResults"
        );

    const refineToggle =
        document.getElementById(
            "refineToggle"
        );

    const searchBudget =
        document.getElementById(
            "searchBudget"
        );

    if (refineForm) {

        refineForm.addEventListener(
            "submit",
            handleUpdatedSearch
        );
    }

    if (childrenSelect) {

        childrenSelect.addEventListener(
            "change",
            createSearchChildAgeFields
        );
    }

    if (departureDate) {

        departureDate.addEventListener(
            "change",
            handleDepartureDateChange
        );
    }

    if (returnDate) {

        returnDate.addEventListener(
            "change",
            updateSearchDuration
        );
    }

    if (applyFiltersButton) {

        applyFiltersButton.addEventListener(
            "click",
            applyResultFilters
        );
    }

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            clearResultFilters
        );
    }

    if (resetSearchButton) {

        resetSearchButton.addEventListener(
            "click",
            resetMainSearch
        );
    }

    if (sortResults) {

        sortResults.addEventListener(
            "change",
            sortAndRenderResults
        );
    }

    if (refineToggle) {

        refineToggle.addEventListener(
            "click",
            toggleRefineSearch
        );
    }

    if (searchBudget) {

        searchBudget.addEventListener(
            "change",
            syncMaximumPriceFilter
        );
    }
}


// ======================================================
// SEARCH FORM SETUP
// ======================================================

function setMinimumSearchDates() {

    const today =
        formatDateForInput(
            new Date()
        );

    const departureInput =
        document.getElementById(
            "searchDepartureDate"
        );

    const returnInput =
        document.getElementById(
            "searchReturnDate"
        );

    if (departureInput) {
        departureInput.min = today;
    }

    if (returnInput) {
        returnInput.min = today;
    }
}


function restoreSearchForm() {

    setElementValue(
        "searchAirport",
        localStorage.getItem("airport") || ""
    );

    setElementValue(
        "searchDestination",
        localStorage.getItem("destination") || ""
    );

    setElementValue(
        "searchDepartureDate",
        localStorage.getItem("departureDate") || ""
    );

    setElementValue(
        "searchReturnDate",
        localStorage.getItem("returnDate") || ""
    );

    setElementValue(
        "searchAdults",
        localStorage.getItem("adults") || "2"
    );

    setElementValue(
        "searchChildren",
        localStorage.getItem("children") || "0"
    );

    setElementValue(
        "searchBoard",
        localStorage.getItem("board") || ""
    );

    setElementValue(
        "searchBudget",
        localStorage.getItem("budget") || ""
    );
}


function setElementValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value;
    }
}


// ======================================================
// CHILD AGES
// ======================================================

function createSearchChildAgeFields() {

    const childrenSelect =
        document.getElementById(
            "searchChildren"
        );

    const agesSection =
        document.getElementById(
            "searchChildAges"
        );

    const fieldsContainer =
        document.getElementById(
            "searchChildAgeFields"
        );

    if (
        !childrenSelect ||
        !agesSection ||
        !fieldsContainer
    ) {
        return;
    }

    const childCount =
        Number(childrenSelect.value) || 0;

    const savedAges =
        getSavedChildAges();

    fieldsContainer.innerHTML = "";

    if (childCount === 0) {

        agesSection.style.display =
            "none";

        return;
    }

    agesSection.style.display =
        "block";

    for (
        let index = 0;
        index < childCount;
        index++
    ) {

        const wrapper =
            document.createElement(
                "div"
            );

        const label =
            document.createElement(
                "label"
            );

        const select =
            document.createElement(
                "select"
            );

        select.id =
            `searchChildAge${index + 1}`;

        select.className =
            "search-child-age";

        label.htmlFor =
            select.id;

        label.textContent =
            `Child ${index + 1} age`;

        for (
            let age = 0;
            age <= 17;
            age++
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(age);

            option.textContent =
                age === 0
                    ? "Under 1"
                    : String(age);

            select.appendChild(option);
        }

        if (
            savedAges[index] !==
            undefined
        ) {

            select.value =
                String(savedAges[index]);
        }

        wrapper.appendChild(label);
        wrapper.appendChild(select);

        fieldsContainer.appendChild(
            wrapper
        );
    }
}


function getSavedChildAges() {

    const stored =
        localStorage.getItem(
            "childAges"
        );

    if (!stored) {
        return [];
    }

    try {

        const ages =
            JSON.parse(stored);

        return Array.isArray(ages)
            ? ages
            : [];

    } catch (error) {

        return [];
    }
}


// ======================================================
// DATE HANDLING
// ======================================================

function handleDepartureDateChange() {

    const departureInput =
        document.getElementById(
            "searchDepartureDate"
        );

    const returnInput =
        document.getElementById(
            "searchReturnDate"
        );

    if (
        !departureInput ||
        !returnInput
    ) {
        return;
    }

    const today =
        formatDateForInput(
            new Date()
        );

    returnInput.min =
        departureInput.value ||
        today;

    if (
        returnInput.value &&
        departureInput.value &&
        returnInput.value <=
            departureInput.value
    ) {

        returnInput.value = "";
    }

    updateSearchDuration();
}


function updateSearchDuration() {

    const durationBox =
        document.getElementById(
            "searchDuration"
        );

    if (!durationBox) {
        return;
    }

    const nights =
        calculateSearchNights();

    if (!nights) {

        durationBox.style.display =
            "none";

        durationBox.textContent = "";

        return;
    }

    durationBox.style.display =
        "block";

    durationBox.textContent =
        `${nights} ${
            nights === 1
                ? "night"
                : "nights"
        } selected • showing ±${PRIMARY_NIGHT_FLEX} nights`;
}


function calculateSearchNights() {

    const departureElement =
        document.getElementById(
            "searchDepartureDate"
        );

    const returnElement =
        document.getElementById(
            "searchReturnDate"
        );

    if (
        !departureElement ||
        !returnElement
    ) {
        return 0;
    }

    const departureValue =
        departureElement.value;

    const returnValue =
        returnElement.value;

    if (
        !departureValue ||
        !returnValue
    ) {
        return 0;
    }

    const departureDate =
        new Date(
            `${departureValue}T00:00:00`
        );

    const returnDate =
        new Date(
            `${returnValue}T00:00:00`
        );

    const difference =
        returnDate.getTime() -
        departureDate.getTime();

    if (difference <= 0) {
        return 0;
    }

    return Math.round(
        difference /
        (
            1000 *
            60 *
            60 *
            24
        )
    );
}


// ======================================================
// UPDATED SEARCH
// ======================================================

async function handleUpdatedSearch(event) {

    event.preventDefault();

    hideRefineError();

    const departureDate =
        document.getElementById(
            "searchDepartureDate"
        ).value;

    const returnDate =
        document.getElementById(
            "searchReturnDate"
        ).value;

    if (
        Boolean(departureDate) !==
        Boolean(returnDate)
    ) {

        showRefineError(
            "Please choose both a departure date and a return date, or leave both empty."
        );

        return;
    }

    const nights =
        calculateSearchNights();

    if (
        departureDate &&
        returnDate &&
        nights < 1
    ) {

        showRefineError(
            "The return date must be after the departure date."
        );

        return;
    }

    saveMainSearch(nights);
    syncMaximumPriceFilter();
    clearSecondaryFiltersOnly();
    updateSearchSummary();

    await loadHolidayResults();
}


function saveMainSearch(nights) {

    const childAges =
        Array.from(
            document.querySelectorAll(
                ".search-child-age"
            )
        ).map(
            select =>
                Number(select.value)
        );

    localStorage.setItem(
        "airport",
        document.getElementById(
            "searchAirport"
        ).value
    );

    localStorage.setItem(
        "destination",
        document.getElementById(
            "searchDestination"
        ).value
    );

    localStorage.setItem(
        "departureDate",
        document.getElementById(
            "searchDepartureDate"
        ).value
    );

    localStorage.setItem(
        "returnDate",
        document.getElementById(
            "searchReturnDate"
        ).value
    );

    localStorage.setItem(
        "nights",
        String(nights || "")
    );

    localStorage.setItem(
        "adults",
        document.getElementById(
            "searchAdults"
        ).value
    );

    localStorage.setItem(
        "children",
        document.getElementById(
            "searchChildren"
        ).value
    );

    localStorage.setItem(
        "childAges",
        JSON.stringify(childAges)
    );

    localStorage.setItem(
        "board",
        document.getElementById(
            "searchBoard"
        ).value
    );

    localStorage.setItem(
        "budget",
        document.getElementById(
            "searchBudget"
        ).value
    );
}


// ======================================================
// BUDGET SYNC
// ======================================================

function syncMaximumPriceFilter() {

    const mainBudget =
        document.getElementById(
            "searchBudget"
        );

    const sidebarMaximumPrice =
        document.getElementById(
            "maximumPriceFilter"
        );

    if (
        !mainBudget ||
        !sidebarMaximumPrice
    ) {
        return;
    }

    sidebarMaximumPrice.value =
        mainBudget.value || "";
}


// ======================================================
// RESET SEARCH
// ======================================================

async function resetMainSearch() {

    const keys = [
        "airport",
        "destination",
        "departureDate",
        "returnDate",
        "nights",
        "adults",
        "children",
        "childAges",
        "board",
        "budget"
    ];

    keys.forEach(
        key =>
            localStorage.removeItem(key)
    );

    setElementValue(
        "searchAirport",
        ""
    );

    setElementValue(
        "searchDestination",
        ""
    );

    setElementValue(
        "searchDepartureDate",
        ""
    );

    setElementValue(
        "searchReturnDate",
        ""
    );

    setElementValue(
        "searchAdults",
        "2"
    );

    setElementValue(
        "searchChildren",
        "0"
    );

    setElementValue(
        "searchBoard",
        ""
    );

    setElementValue(
        "searchBudget",
        ""
    );

    createSearchChildAgeFields();
    updateSearchDuration();
    syncMaximumPriceFilter();
    clearSecondaryFiltersOnly();
    updateSearchSummary();

    await loadHolidayResults();
}


// ======================================================
// SEARCH SUMMARY
// ======================================================

function updateSearchSummary() {

    const airport =
        localStorage.getItem(
            "airport"
        ) || "Any UK airport";

    const destination =
        localStorage.getItem(
            "destination"
        ) || "Anywhere";

    const departureDate =
        localStorage.getItem(
            "departureDate"
        ) || "";

    const returnDate =
        localStorage.getItem(
            "returnDate"
        ) || "";

    const nights =
        Number(
            localStorage.getItem(
                "nights"
            )
        ) || 0;

    const adults =
        localStorage.getItem(
            "adults"
        ) || "2";

    const children =
        localStorage.getItem(
            "children"
        ) || "0";

    const board =
        localStorage.getItem(
            "board"
        ) || "Any board basis";

    const budget =
        localStorage.getItem(
            "budget"
        ) || "";

    const summaryParts = [
        `From ${airport}`,
        `to ${destination}`
    ];

    if (
        departureDate &&
        returnDate
    ) {

        summaryParts.push(
            `${formatDisplayDate(
                departureDate
            )} to ${formatDisplayDate(
                returnDate
            )}`
        );

        summaryParts.push(
            `Flexible ±${PRIMARY_DATE_FLEX_DAYS} days`
        );

        if (nights > 0) {

            summaryParts.push(
                `${nights} ${
                    nights === 1
                        ? "night"
                        : "nights"
                } ±${PRIMARY_NIGHT_FLEX} nights`
            );
        }

    } else {

        summaryParts.push(
            "Any travel dates"
        );
    }

    summaryParts.push(
        `${adults} ${
            Number(adults) === 1
                ? "adult"
                : "adults"
        }`
    );

    if (
        Number(children) > 0
    ) {

        summaryParts.push(
            `${children} ${
                Number(children) === 1
                    ? "child"
                    : "children"
            }`
        );
    }

    summaryParts.push(board);

    summaryParts.push(
        budget
            ? `Maximum £${formatNumber(
                budget
            )}`
            : "Any budget"
    );

    const summary =
        document.getElementById(
            "searchSummary"
        );

    if (summary) {

        summary.textContent =
            summaryParts.join(" • ");
    }
}


// ======================================================
// LOAD DATABASE RESULTS
// ======================================================

async function loadHolidayResults() {

    showLoadingMessage();

    try {

        const [
            hotelsResponse,
            offersResponse
        ] = await Promise.all([

            window.db
                .from("hotels")
                .select("*"),

            window.db
                .from("holiday_offers")
                .select("*")
                .order(
                    "price",
                    {
                        ascending: true
                    }
                )
        ]);

        if (hotelsResponse.error) {
            throw hotelsResponse.error;
        }

        if (offersResponse.error) {
            throw offersResponse.error;
        }

        allHotels =
            hotelsResponse.data || [];

        allOffers =
            offersResponse.data || [];

        groupedResults =
            createGroupedResults(
                allHotels,
                allOffers
            );

        if (groupedResults.length > 0) {

            resultsMode = "matches";

        } else {

            groupedResults =
                createAlternativeGroupedResults(
                    allHotels,
                    allOffers
                );

            resultsMode =
                groupedResults.length > 0
                    ? "alternatives"
                    : "none";
        }

        populateResultFilterOptions();

        if (
            resultsMode ===
            "alternatives"
        ) {

            clearAlternativeMaximumPriceFilter();
        }

        applyResultFilters();

    } catch (error) {

        console.error(
            "Holiday results error:",
            error
        );

        showResultsMessage(
            "Unable to load holidays",
            "There was a problem connecting to the holiday database. Please try again."
        );
    }
}


// ======================================================
// GROUP NORMAL HOTEL RESULTS
// ======================================================

function createGroupedResults(
    hotels,
    offers
) {

    const search =
        getCurrentSearch();

    const matchedOffers =
        offers.filter(
            offer =>
                offerMatchesSearch(
                    offer,
                    search
                )
        );

    const hotelMap =
        createHotelMap(hotels);

    const groupedMap =
        new Map();

    matchedOffers.forEach(offer => {

        const hotelId =
            String(
                offer.hotel_id || ""
            );

        const hotel =
            hotelMap.get(hotelId);

        if (!hotel) {
            return;
        }

        if (
            search.destination &&
            !hotelMatchesDestination(
                hotel,
                search.destination
            )
        ) {
            return;
        }

        if (
            !groupedMap.has(hotelId)
        ) {

            groupedMap.set(
                hotelId,
                {
                    hotel,
                    offers: [],
                    isAlternative: false
                }
            );
        }

        groupedMap
            .get(hotelId)
            .offers
            .push(offer);
    });

    return Array.from(
        groupedMap.values()
    ).map(group => {

        group.offers.sort(
            (first, second) =>
                Number(
                    first.price || 0
                ) -
                Number(
                    second.price || 0
                )
        );

        group.cheapestOffer =
            group.offers[0];

        return group;
    });
}


// ======================================================
// ALTERNATIVE RESULTS
// ======================================================

function createAlternativeGroupedResults(
    hotels,
    offers
) {

    const search =
        getCurrentSearch();

    const hotelMap =
        createHotelMap(hotels);

    const groupedMap =
        new Map();

    offers.forEach(originalOffer => {

        const hotelId =
            String(
                originalOffer.hotel_id || ""
            );

        const hotel =
            hotelMap.get(hotelId);

        if (!hotel) {
            return;
        }

        // Keep destination relevant.
        if (
            search.destination &&
            !hotelMatchesDestination(
                hotel,
                search.destination
            )
        ) {
            return;
        }

        // Keep the requested departure airport.
        if (
            search.airport &&
            normaliseText(
                originalOffer.airport
            ) !==
            normaliseText(
                search.airport
            )
        ) {
            return;
        }

        // Keep the requested board basis.
        if (
            search.board &&
            normaliseText(
                originalOffer.board_basis
            ) !==
            normaliseText(
                search.board
            )
        ) {
            return;
        }

        const alternativeInfo =
            calculateAlternativeInfo(
                originalOffer,
                search
            );

        if (
            !alternativeInfo.allowed
        ) {
            return;
        }

        const offer = {
            ...originalOffer,

            _alternativeScore:
                alternativeInfo.score,

            _alternativeReasons:
                alternativeInfo.reasons,

            _dateDifference:
                alternativeInfo.dateDifference,

            _nightDifference:
                alternativeInfo.nightDifference,

            _budgetDifference:
                alternativeInfo.budgetDifference
        };

        if (
            !groupedMap.has(hotelId)
        ) {

            groupedMap.set(
                hotelId,
                {
                    hotel,
                    offers: [],
                    isAlternative: true
                }
            );
        }

        groupedMap
            .get(hotelId)
            .offers
            .push(offer);
    });

    const groups =
        Array.from(
            groupedMap.values()
        );

    groups.forEach(group => {

        group.offers.sort(
            (first, second) => {

                const scoreDifference =
                    Number(
                        first._alternativeScore || 0
                    ) -
                    Number(
                        second._alternativeScore || 0
                    );

                if (scoreDifference !== 0) {
                    return scoreDifference;
                }

                return (
                    Number(
                        first.price || 0
                    ) -
                    Number(
                        second.price || 0
                    )
                );
            }
        );

        group.cheapestOffer =
            group.offers[0];

        group.alternativeScore =
            Number(
                group.cheapestOffer
                    ._alternativeScore || 0
            );
    });

    groups.sort(
        (first, second) => {

            const scoreDifference =
                Number(
                    first.alternativeScore || 0
                ) -
                Number(
                    second.alternativeScore || 0
                );

            if (scoreDifference !== 0) {
                return scoreDifference;
            }

            return (
                Number(
                    first.cheapestOffer.price || 0
                ) -
                Number(
                    second.cheapestOffer.price || 0
                )
            );
        }
    );

    return groups;
}


function calculateAlternativeInfo(
    offer,
    search
) {

    let score = 0;

    const reasons = [];

    let dateDifference = 0;
    let nightDifference = 0;
    let budgetDifference = 0;

    // --------------------------------------------------
    // DATE DIFFERENCE
    // --------------------------------------------------

    if (search.departureDate) {

        dateDifference =
            getSignedDateDifference(
                offer.departure_date,
                search.departureDate
            );

        if (dateDifference === null) {

            return {
                allowed: false,
                score: 0,
                reasons: []
            };
        }

        if (
            Math.abs(dateDifference) >
            ALTERNATIVE_DATE_FLEX_DAYS
        ) {

            return {
                allowed: false,
                score: 0,
                reasons: []
            };
        }

        if (
            Math.abs(dateDifference) >
            PRIMARY_DATE_FLEX_DAYS
        ) {

            reasons.push(
                createDateDifferenceLabel(
                    dateDifference
                )
            );
        }

        score +=
            Math.abs(dateDifference) *
            10;
    }

    // --------------------------------------------------
    // NIGHT DIFFERENCE
    // --------------------------------------------------

    if (search.nights) {

        const offerNights =
            Number(
                offer.nights || 0
            );

        if (!offerNights) {

            return {
                allowed: false,
                score: 0,
                reasons: []
            };
        }

        nightDifference =
            offerNights -
            search.nights;

        if (
            Math.abs(nightDifference) >
            ALTERNATIVE_NIGHT_FLEX
        ) {

            return {
                allowed: false,
                score: 0,
                reasons: []
            };
        }

        if (
            Math.abs(nightDifference) >
            PRIMARY_NIGHT_FLEX
        ) {

            reasons.push(
                createNightDifferenceLabel(
                    nightDifference
                )
            );
        }

        score +=
            Math.abs(nightDifference) *
            8;
    }

    // --------------------------------------------------
    // BUDGET DIFFERENCE
    // --------------------------------------------------

    if (search.budget) {

        const offerPrice =
            Number(
                offer.price || 0
            );

        budgetDifference =
            offerPrice -
            search.budget;

        if (budgetDifference > 0) {

            const maximumOverspend =
                Math.max(
                    1000,
                    search.budget * 0.35
                );

            if (
                budgetDifference >
                maximumOverspend
            ) {

                return {
                    allowed: false,
                    score: 0,
                    reasons: []
                };
            }

            reasons.push(
                `£${formatNumber(
                    budgetDifference
                )} over budget`
            );

            score +=
                budgetDifference /
                20;
        }
    }

    // This should only be used when the normal search
    // returned zero matches.
    if (reasons.length === 0) {

        reasons.push(
            "Closest available alternative"
        );
    }

    return {

        allowed: true,

        score,

        reasons,

        dateDifference,

        nightDifference,

        budgetDifference
    };
}


function createDateDifferenceLabel(
    difference
) {

    const absolute =
        Math.abs(difference);

    if (difference > 0) {

        return `${absolute} ${
            absolute === 1
                ? "day"
                : "days"
        } later`;
    }

    return `${absolute} ${
        absolute === 1
            ? "day"
            : "days"
    } earlier`;
}


function createNightDifferenceLabel(
    difference
) {

    const absolute =
        Math.abs(difference);

    if (difference > 0) {

        return `${absolute} ${
            absolute === 1
                ? "night"
                : "nights"
        } longer`;
    }

    return `${absolute} ${
        absolute === 1
            ? "night"
            : "nights"
    } shorter`;
}


function getSignedDateDifference(
    offerValue,
    requestedValue
) {

    const offerDateValue =
        String(
            offerValue || ""
        ).slice(0, 10);

    const requestedDateValue =
        String(
            requestedValue || ""
        ).slice(0, 10);

    if (
        !offerDateValue ||
        !requestedDateValue
    ) {
        return null;
    }

    const offerDate =
        new Date(
            `${offerDateValue}T00:00:00`
        );

    const requestedDate =
        new Date(
            `${requestedDateValue}T00:00:00`
        );

    if (
        Number.isNaN(
            offerDate.getTime()
        ) ||
        Number.isNaN(
            requestedDate.getTime()
        )
    ) {
        return null;
    }

    const millisecondsPerDay =
        1000 *
        60 *
        60 *
        24;

    return Math.round(
        (
            offerDate.getTime() -
            requestedDate.getTime()
        ) /
        millisecondsPerDay
    );
}


function clearAlternativeMaximumPriceFilter() {

    const maximumPriceFilter =
        document.getElementById(
            "maximumPriceFilter"
        );

    if (maximumPriceFilter) {

        maximumPriceFilter.value =
            "";
    }
}


// ======================================================
// HOTEL MAP
// ======================================================

function createHotelMap(hotels) {

    const hotelMap =
        new Map();

    hotels.forEach(hotel => {

        hotelMap.set(
            String(hotel.id),
            hotel
        );
    });

    return hotelMap;
}


// ======================================================
// MAIN SEARCH MATCHING
// ======================================================

function getCurrentSearch() {

    return {

        airport:
            (
                localStorage.getItem(
                    "airport"
                ) || ""
            ).trim(),

        destination:
            (
                localStorage.getItem(
                    "destination"
                ) || ""
            ).trim(),

        departureDate:
            localStorage.getItem(
                "departureDate"
            ) || "",

        nights:
            Number(
                localStorage.getItem(
                    "nights"
                )
            ) || 0,

        board:
            (
                localStorage.getItem(
                    "board"
                ) || ""
            ).trim(),

        budget:
            Number(
                localStorage.getItem(
                    "budget"
                )
            ) || 0
    };
}


function offerMatchesSearch(
    offer,
    search
) {

    if (
        search.airport &&
        normaliseText(
            offer.airport
        ) !==
        normaliseText(
            search.airport
        )
    ) {
        return false;
    }

    if (
        search.board &&
        normaliseText(
            offer.board_basis
        ) !==
        normaliseText(
            search.board
        )
    ) {
        return false;
    }

    if (
        search.budget &&
        Number(
            offer.price || 0
        ) >
        search.budget
    ) {
        return false;
    }

    // ==================================================
    // FLEXIBLE DURATION
    // Example:
    // Search 14 nights = allow 11 to 17 nights
    // ==================================================

    if (search.nights) {

        const offerNights =
            Number(
                offer.nights || 0
            );

        if (!offerNights) {
            return false;
        }

        const nightDifference =
            Math.abs(
                offerNights -
                search.nights
            );

        if (
            nightDifference >
            PRIMARY_NIGHT_FLEX
        ) {
            return false;
        }
    }

    // ==================================================
    // FLEXIBLE DEPARTURE DATE
    // Allow ±3 days
    // ==================================================

    if (search.departureDate) {

        const differenceInDays =
            getSignedDateDifference(
                offer.departure_date,
                search.departureDate
            );

        if (
            differenceInDays === null
        ) {
            return false;
        }

        if (
            Math.abs(
                differenceInDays
            ) >
            PRIMARY_DATE_FLEX_DAYS
        ) {
            return false;
        }
    }

    return true;
}


// ======================================================
// DESTINATION MATCHING
// ======================================================

function hotelMatchesDestination(
    hotel,
    destination
) {

    const selected =
        normaliseText(destination);

    const values = [
        hotel.country,
        hotel.destination,
        hotel.region,
        hotel.location
    ];

    return values.some(value => {

        const normalised =
            normaliseText(value);

        if (!normalised) {
            return false;
        }

        return (
            normalised === selected ||
            normalised.includes(selected) ||
            selected.includes(normalised)
        );
    });
}


// ======================================================
// SIDEBAR FILTER OPTIONS
// ======================================================

function populateResultFilterOptions() {

    populateSelectOptions(
        "destinationFilter",
        groupedResults.map(
            group =>
                group.hotel.destination ||
                group.hotel.country
        ),
        "All destinations"
    );

    populateSelectOptions(
        "supplierFilter",
        groupedResults.flatMap(
            group =>
                group.offers.map(
                    offer =>
                        offer.supplier
                )
        ),
        "All suppliers"
    );

    populateSelectOptions(
        "boardFilter",
        groupedResults.flatMap(
            group =>
                group.offers.map(
                    offer =>
                        offer.board_basis
                )
        ),
        "All board types"
    );
}


function populateSelectOptions(
    selectId,
    values,
    defaultLabel
) {

    const select =
        document.getElementById(
            selectId
        );

    if (!select) {
        return;
    }

    const previousValue =
        select.value;

    const uniqueValues =
        Array.from(
            new Set(
                values
                    .filter(Boolean)
                    .map(
                        value =>
                            String(value).trim()
                    )
            )
        ).sort(
            (first, second) =>
                first.localeCompare(second)
        );

    select.innerHTML = "";

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        defaultLabel;

    select.appendChild(
        defaultOption
    );

    uniqueValues.forEach(value => {

        const option =
            document.createElement(
                "option"
            );

        option.value = value;
        option.textContent = value;

        select.appendChild(option);
    });

    if (
        uniqueValues.includes(
            previousValue
        )
    ) {

        select.value =
            previousValue;
    }
}


// ======================================================
// SIDEBAR FILTERING
// ======================================================

function applyResultFilters() {

    const destinationElement =
        document.getElementById(
            "destinationFilter"
        );

    const supplierElement =
        document.getElementById(
            "supplierFilter"
        );

    const boardElement =
        document.getElementById(
            "boardFilter"
        );

    const maximumPriceElement =
        document.getElementById(
            "maximumPriceFilter"
        );

    const destination =
        destinationElement
            ? destinationElement.value
            : "";

    const supplier =
        supplierElement
            ? supplierElement.value
            : "";

    const board =
        boardElement
            ? boardElement.value
            : "";

    const maximumPrice =
        maximumPriceElement
            ? Number(
                maximumPriceElement.value
            ) || 0
            : 0;

    visibleResults =
        groupedResults
            .map(group => {

                let filteredOffers =
                    [...group.offers];

                if (supplier) {

                    filteredOffers =
                        filteredOffers.filter(
                            offer =>
                                normaliseText(
                                    offer.supplier
                                ) ===
                                normaliseText(
                                    supplier
                                )
                        );
                }

                if (board) {

                    filteredOffers =
                        filteredOffers.filter(
                            offer =>
                                normaliseText(
                                    offer.board_basis
                                ) ===
                                normaliseText(
                                    board
                                )
                        );
                }

                if (maximumPrice) {

                    filteredOffers =
                        filteredOffers.filter(
                            offer =>
                                Number(
                                    offer.price || 0
                                ) <=
                                maximumPrice
                        );
                }

                if (
                    filteredOffers.length ===
                    0
                ) {
                    return null;
                }

                const hotelDestination =
                    group.hotel.destination ||
                    group.hotel.country ||
                    "";

                if (
                    destination &&
                    normaliseText(
                        hotelDestination
                    ) !==
                    normaliseText(
                        destination
                    )
                ) {
                    return null;
                }

                if (
                    group.isAlternative
                ) {

                    filteredOffers.sort(
                        (first, second) => {

                            const scoreDifference =
                                Number(
                                    first._alternativeScore ||
                                    0
                                ) -
                                Number(
                                    second._alternativeScore ||
                                    0
                                );

                            if (
                                scoreDifference !== 0
                            ) {
                                return scoreDifference;
                            }

                            return (
                                Number(
                                    first.price || 0
                                ) -
                                Number(
                                    second.price || 0
                                )
                            );
                        }
                    );

                } else {

                    filteredOffers.sort(
                        (first, second) =>
                            Number(
                                first.price || 0
                            ) -
                            Number(
                                second.price || 0
                            )
                    );
                }

                return {

                    hotel:
                        group.hotel,

                    offers:
                        filteredOffers,

                    cheapestOffer:
                        filteredOffers[0],

                    isAlternative:
                        Boolean(
                            group.isAlternative
                        ),

                    alternativeScore:
                        Number(
                            filteredOffers[0]
                                ._alternativeScore || 0
                        )
                };
            })
            .filter(Boolean);

    sortAndRenderResults();
}


function clearResultFilters() {

    clearSecondaryFiltersOnly();

    if (
        resultsMode ===
        "alternatives"
    ) {

        clearAlternativeMaximumPriceFilter();
    }

    visibleResults =
        groupedResults.map(
            group => ({

                hotel:
                    group.hotel,

                offers:
                    [...group.offers],

                cheapestOffer:
                    group.cheapestOffer,

                isAlternative:
                    Boolean(
                        group.isAlternative
                    ),

                alternativeScore:
                    Number(
                        group.alternativeScore || 0
                    )
            })
        );

    sortAndRenderResults();
}


function clearSecondaryFiltersOnly() {

    const destinationFilter =
        document.getElementById(
            "destinationFilter"
        );

    const supplierFilter =
        document.getElementById(
            "supplierFilter"
        );

    const boardFilter =
        document.getElementById(
            "boardFilter"
        );

    const maximumPriceFilter =
        document.getElementById(
            "maximumPriceFilter"
        );

    if (destinationFilter) {
        destinationFilter.value = "";
    }

    if (supplierFilter) {
        supplierFilter.value = "";
    }

    if (boardFilter) {
        boardFilter.value = "";
    }

    if (maximumPriceFilter) {

        if (
            resultsMode ===
            "alternatives"
        ) {

            maximumPriceFilter.value =
                "";

        } else {

            const mainBudget =
                document.getElementById(
                    "searchBudget"
                );

            maximumPriceFilter.value =
                mainBudget
                    ? mainBudget.value
                    : "";
        }
    }
}


// ======================================================
// SORTING
// ======================================================

function sortAndRenderResults() {

    const sortElement =
        document.getElementById(
            "sortResults"
        );

    const sortValue =
        sortElement
            ? sortElement.value
            : "price-low";

    const sortedResults =
        [...visibleResults];

    switch (sortValue) {

        case "price-high":

            sortedResults.sort(
                (first, second) =>
                    Number(
                        second.cheapestOffer.price ||
                        0
                    ) -
                    Number(
                        first.cheapestOffer.price ||
                        0
                    )
            );

            break;

        case "rating-high":

            sortedResults.sort(
                (first, second) =>
                    Number(
                        second.hotel.rating || 0
                    ) -
                    Number(
                        first.hotel.rating || 0
                    )
            );

            break;

        case "stars-high":

            sortedResults.sort(
                (first, second) =>
                    Number(
                        second.hotel.stars || 0
                    ) -
                    Number(
                        first.hotel.stars || 0
                    )
            );

            break;

        case "name":

            sortedResults.sort(
                (first, second) =>
                    String(
                        first.hotel.name || ""
                    ).localeCompare(
                        String(
                            second.hotel.name || ""
                        )
                    )
            );

            break;

        case "price-low":
        default:

            if (
                resultsMode ===
                "alternatives"
            ) {

                sortedResults.sort(
                    (first, second) => {

                        const scoreDifference =
                            Number(
                                first.alternativeScore ||
                                first.cheapestOffer
                                    ._alternativeScore ||
                                0
                            ) -
                            Number(
                                second.alternativeScore ||
                                second.cheapestOffer
                                    ._alternativeScore ||
                                0
                            );

                        if (
                            scoreDifference !== 0
                        ) {
                            return scoreDifference;
                        }

                        return (
                            Number(
                                first.cheapestOffer.price ||
                                0
                            ) -
                            Number(
                                second.cheapestOffer.price ||
                                0
                            )
                        );
                    }
                );

            } else {

                sortedResults.sort(
                    (first, second) =>
                        Number(
                            first.cheapestOffer.price ||
                            0
                        ) -
                        Number(
                            second.cheapestOffer.price ||
                            0
                        )
                );
            }

            break;
    }

    renderResults(sortedResults);
}


// ======================================================
// RENDER RESULTS
// ======================================================

function renderResults(results) {

    const container =
        document.getElementById(
            "resultsContainer"
        );

    const countElement =
        document.getElementById(
            "resultsCount"
        );

    if (!container) {
        return;
    }

    if (countElement) {

        if (
            resultsMode ===
            "alternatives"
        ) {

            countElement.textContent =
                `${results.length} ${
                    results.length === 1
                        ? "alternative hotel"
                        : "alternative hotels"
                } found`;

        } else {

            countElement.textContent =
                `${results.length} ${
                    results.length === 1
                        ? "hotel"
                        : "hotels"
                } found`;
        }
    }

    if (results.length === 0) {

        showResultsMessage(
            "No matching holidays found",
            "We could not find suitable holidays for this search. Try changing your airport, destination, dates, board basis or budget."
        );

        return;
    }

    const alternativeNotice =
        resultsMode ===
        "alternatives"
            ? createAlternativeResultsNotice()
            : "";

    container.innerHTML =
        alternativeNotice +
        results.map(
            createHotelCard
        ).join("");

    attachComparisonButtons();
}


function createAlternativeResultsNotice() {

    return `
        <div class="alternative-results-notice">

            <div class="alternative-results-icon">
                💡
            </div>

            <div>

                <h2>
                    No exact flexible matches — here are the closest alternatives
                </h2>

                <p>
                    These holidays fall outside one or more parts of your original search.
                    We have kept your destination, departure airport and board basis where selected,
                    and clearly highlighted what is different.
                </p>

            </div>

        </div>
    `;
}


function createHotelCard(group) {

    const hotel =
        group.hotel;

    const cheapest =
        group.cheapestOffer;

    const hotelId =
        escapeAttribute(
            String(hotel.id)
        );

    const hotelName =
        escapeHtml(
            hotel.name ||
            "Hotel"
        );

    const location =
        [
            hotel.destination,
            hotel.country
        ]
            .filter(Boolean)
            .join(", ");

    const stars =
        createStars(
            Number(
                hotel.stars || 0
            )
        );

    const image =
        getHotelImage(hotel);

    const description =
        escapeHtml(
            hotel.description ||
            "Package holiday offers available for this hotel."
        );

    const bookingUrl =
        createSafeBookingUrl(
            cheapest.booking_url
        );

    const demoBadge =
        DEMO_MODE
            ? `
                <div class="demo-offer-badge">
                    Demo offer — test data only
                </div>
            `
            : "";

    const alternativeBadge =
        createAlternativeBadge(
            group
        );

    const bookingButton =
        bookingUrl
            ? `
                <a
                    class="book-button"
                    href="${bookingUrl}"
                    target="_blank"
                    rel="noopener sponsored"
                >
                    View Deal
                </a>
            `
            : `
                <span
                    class="book-button disabled"
                    title="No supplier booking link has been added for this offer yet."
                >
                    No booking link
                </span>
            `;

    return `
        <article class="hotel-result-card">

            <div class="hotel-main">

                <div class="hotel-image-wrap">

                    <img
                        class="hotel-image"
                        src="${escapeAttribute(image)}"
                        alt="${hotelName}"
                        onerror="useFallbackImage(this)"
                    >

                </div>

                <div class="hotel-details">

                    <div class="hotel-location">
                        ${escapeHtml(
                            location ||
                            "Destination unavailable"
                        )}
                    </div>

                    <h2 class="hotel-name">
                        ${hotelName}
                    </h2>

                    ${alternativeBadge}

                    ${demoBadge}

                    <div class="hotel-stars">
                        ${stars}
                    </div>

                    <div class="offer-information">

                        <div>
                            <strong>Departure:</strong>
                            ${escapeHtml(
                                formatDisplayDate(
                                    cheapest.departure_date
                                )
                            )}
                        </div>

                        <div>
                            <strong>Airport:</strong>
                            ${escapeHtml(
                                cheapest.airport ||
                                "Any airport"
                            )}
                        </div>

                        <div>
                            <strong>Duration:</strong>
                            ${escapeHtml(
                                String(
                                    cheapest.nights ||
                                    "-"
                                )
                            )}
                            nights
                        </div>

                        <div>
                            <strong>Board:</strong>
                            ${escapeHtml(
                                cheapest.board_basis ||
                                "Not stated"
                            )}
                        </div>

                        <div>
                            <strong>Room:</strong>
                            ${escapeHtml(
                                cheapest.room_type ||
                                "Standard room"
                            )}
                        </div>

                        <div>
                            <strong>Offers:</strong>
                            ${group.offers.length}
                            ${
                                group.offers.length === 1
                                    ? "supplier"
                                    : "suppliers"
                            }
                        </div>

                    </div>

                    <p class="hotel-description">
                        ${description}
                    </p>

                </div>

                <div class="price-panel">

                    <div>

                        <div class="cheapest-label">
                            ${
                                group.isAlternative
                                    ? "Closest alternative"
                                    : DEMO_MODE
                                        ? "Example offer"
                                        : "Cheapest offer"
                            }
                        </div>

                        <div class="supplier-name">
                            ${escapeHtml(
                                cheapest.supplier ||
                                "Supplier"
                            )}
                        </div>

                        <div class="price">
                            £${formatNumber(
                                cheapest.price
                            )}
                        </div>

                        <div class="total-price-label">
                            ${
                                DEMO_MODE
                                    ? "Example test price"
                                    : "Total package price"
                            }
                        </div>

                    </div>

                    <button
                        type="button"
                        class="compare-button"
                        data-hotel-id="${hotelId}"
                    >
                        Compare ${group.offers.length}
                        ${
                            group.offers.length === 1
                                ? "offer"
                                : "offers"
                        }
                    </button>

                    ${bookingButton}

                </div>

            </div>

            <div
                id="comparison-${hotelId}"
                class="supplier-comparison"
            >

                <h3>
                    Compare supplier offers
                </h3>

                <div class="supplier-table-wrap">

                    <table class="supplier-table">

                        <thead>

                            <tr>
                                <th>Supplier</th>
                                <th>Departure</th>
                                <th>Airport</th>
                                <th>Nights</th>
                                <th>Board</th>
                                <th>Price</th>
                                <th>Difference</th>
                                <th>Book</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${group.offers
                                .map(
                                    createSupplierOfferRow
                                )
                                .join("")}

                        </tbody>

                    </table>

                </div>

            </div>

        </article>
    `;
}


function createAlternativeBadge(group) {

    if (
        !group.isAlternative ||
        !group.cheapestOffer
    ) {
        return "";
    }

    const reasons =
        Array.isArray(
            group.cheapestOffer
                ._alternativeReasons
        )
            ? group.cheapestOffer
                ._alternativeReasons
            : [];

    if (
        reasons.length === 0
    ) {
        return "";
    }

    return `
        <div class="alternative-match-box">

            <strong>
                Closest alternative:
            </strong>

            <div class="alternative-match-tags">

                ${reasons
                    .map(
                        reason => `
                            <span class="alternative-match-tag">
                                ${escapeHtml(reason)}
                            </span>
                        `
                    )
                    .join("")}

            </div>

        </div>
    `;
}


function createSupplierOfferRow(offer) {

    const bookingUrl =
        createSafeBookingUrl(
            offer.booking_url
        );

    const bookingLink =
        bookingUrl
            ? `
                <a
                    class="small-book-link"
                    href="${bookingUrl}"
                    target="_blank"
                    rel="noopener sponsored"
                >
                    View Deal
                </a>
            `
            : `
                <span
                    class="small-book-link disabled"
                    title="No supplier booking link has been added for this offer yet."
                >
                    No booking link
                </span>
            `;

    const differenceText =
        Array.isArray(
            offer._alternativeReasons
        ) &&
        offer._alternativeReasons.length > 0
            ? offer._alternativeReasons
                .join(", ")
            : "Matches search";

    return `
        <tr>

            <td>
                ${escapeHtml(
                    offer.supplier ||
                    "Supplier"
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatDisplayDate(
                        offer.departure_date
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    offer.airport ||
                    "-"
                )}
            </td>

            <td>
                ${escapeHtml(
                    String(
                        offer.nights ||
                        "-"
                    )
                )}
            </td>

            <td>
                ${escapeHtml(
                    offer.board_basis ||
                    "-"
                )}
            </td>

            <td class="supplier-price">
                £${formatNumber(
                    offer.price
                )}
            </td>

            <td>
                ${
                    resultsMode ===
                    "alternatives"
                        ? `
                            <span class="supplier-difference">
                                ${escapeHtml(
                                    differenceText
                                )}
                            </span>
                        `
                        : "—"
                }
            </td>

            <td>
                ${bookingLink}
            </td>

        </tr>
    `;
}


// ======================================================
// COMPARISON BUTTONS
// ======================================================

function attachComparisonButtons() {

    const buttons =
        document.querySelectorAll(
            ".compare-button"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const hotelId =
                    button.dataset.hotelId;

                const comparison =
                    document.getElementById(
                        `comparison-${hotelId}`
                    );

                if (!comparison) {
                    return;
                }

                comparison.classList.toggle(
                    "open"
                );

                const isOpen =
                    comparison.classList.contains(
                        "open"
                    );

                const offerCount =
                    comparison.querySelectorAll(
                        "tbody tr"
                    ).length;

                button.textContent =
                    isOpen
                        ? "Hide offers"
                        : `Compare ${offerCount} ${
                            offerCount === 1
                                ? "offer"
                                : "offers"
                        }`;
            }
        );
    });
}


// ======================================================
// MOBILE REFINE SEARCH
// ======================================================

function toggleRefineSearch() {

    const form =
        document.getElementById(
            "refineSearchForm"
        );

    const button =
        document.getElementById(
            "refineToggle"
        );

    if (
        !form ||
        !button
    ) {
        return;
    }

    form.classList.toggle(
        "mobile-hidden"
    );

    const hidden =
        form.classList.contains(
            "mobile-hidden"
        );

    button.textContent =
        hidden
            ? "Show Search"
            : "Hide Search";
}


// ======================================================
// DEMO NOTICE AND EXTRA STYLES
// ======================================================

function injectResultEnhancementStyles() {

    if (
        document.getElementById(
            "resultEnhancementStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "resultEnhancementStyles";

    style.textContent = `
        .demo-mode-notice {
            margin: 0 0 22px;
            padding: 14px 16px;
            border: 1px solid #f4c95d;
            border-radius: 10px;
            background: #fff8df;
            color: #6f5200;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.5;
        }

        .demo-offer-badge {
            display: inline-flex;
            align-items: center;
            margin: 2px 0 10px;
            padding: 6px 10px;
            border: 1px solid #f4c95d;
            border-radius: 999px;
            background: #fff8df;
            color: #6f5200;
            font-size: 12px;
            font-weight: 800;
        }

        .hotel-image-wrap {
            position: relative;
            overflow: hidden;
        }

        .hotel-image {
            background: #dbeafe;
        }

        .alternative-results-notice {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #93c5fd;
            border-radius: 15px;
            background: #eff6ff;
            color: #1e3a5f;
            box-shadow:
                0 6px 20px
                rgba(31, 41, 55, 0.06);
        }

        .alternative-results-notice h2 {
            margin: 0 0 7px;
            font-size: 20px;
        }

        .alternative-results-notice p {
            margin: 0;
            line-height: 1.55;
        }

        .alternative-results-icon {
            flex: 0 0 auto;
            font-size: 26px;
            line-height: 1;
        }

        .alternative-match-box {
            margin: 4px 0 12px;
            padding: 11px 12px;
            border: 1px solid #93c5fd;
            border-radius: 10px;
            background: #eff6ff;
            color: #1e3a5f;
            font-size: 13px;
        }

        .alternative-match-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 8px;
        }

        .alternative-match-tag {
            display: inline-flex;
            align-items: center;
            padding: 5px 8px;
            border-radius: 999px;
            background: #ffffff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 800;
        }

        .supplier-difference {
            display: inline-block;
            max-width: 220px;
            color: #1d4ed8;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
        }

        @media (max-width: 620px) {

            .alternative-results-notice {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);
}


function showDemoModeNotice() {

    const pageShell =
        document.querySelector(
            ".page-shell"
        );

    if (!pageShell) {
        return;
    }

    const existingNotice =
        document.getElementById(
            "demoModeNotice"
        );

    if (!DEMO_MODE) {

        if (existingNotice) {
            existingNotice.remove();
        }

        return;
    }

    if (existingNotice) {
        return;
    }

    const notice =
        document.createElement(
            "div"
        );

    notice.id =
        "demoModeNotice";

    notice.className =
        "demo-mode-notice";

    notice.textContent =
        "Demo mode: the holidays, supplier names and prices currently shown are test data. They are not live prices or confirmed availability.";

    pageShell.insertBefore(
        notice,
        pageShell.firstChild
    );
}


// ======================================================
// DISPLAY HELPERS
// ======================================================

function showLoadingMessage() {

    const count =
        document.getElementById(
            "resultsCount"
        );

    const container =
        document.getElementById(
            "resultsContainer"
        );

    if (count) {

        count.textContent =
            "Loading results...";
    }

    if (container) {

        container.innerHTML = `
            <div class="loading-box">

                <h2>
                    Finding holiday offers...
                </h2>

                <p>
                    We are checking the latest offers in the database.
                </p>

            </div>
        `;
    }
}


function showResultsMessage(
    title,
    message
) {

    const container =
        document.getElementById(
            "resultsContainer"
        );

    if (!container) {
        return;
    }

    const count =
        document.getElementById(
            "resultsCount"
        );

    if (
        count &&
        resultsMode === "none"
    ) {

        count.textContent =
            "0 hotels found";
    }

    container.innerHTML = `
        <div class="message-box">

            <h2>
                ${escapeHtml(title)}
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}


function showRefineError(message) {

    const errorBox =
        document.getElementById(
            "refineError"
        );

    if (!errorBox) {
        return;
    }

    errorBox.textContent =
        message;

    errorBox.style.display =
        "block";
}


function hideRefineError() {

    const errorBox =
        document.getElementById(
            "refineError"
        );

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";

    errorBox.style.display =
        "none";
}


// ======================================================
// IMAGE HANDLING
// ======================================================

function getHotelImage(hotel) {

    const image =
        String(
            hotel.main_image || ""
        ).trim();

    if (image) {
        return image;
    }

    const destination =
        normaliseText(
            hotel.country ||
            hotel.destination
        );

    const destinationImages = {

        egypt:
            "images/egypt.jpg",

        turkey:
            "images/turkey.jpg",

        spain:
            "images/spain.jpg",

        greece:
            "images/greece.jpg",

        cyprus:
            "images/cyprus.jpg",

        portugal:
            "images/portugal.jpg",

        morocco:
            "images/morocco.jpg",

        tunisia:
            "images/tunisia.jpg",

        bulgaria:
            "images/bulgaria.jpg"
    };

    return (
        destinationImages[destination] ||
        createFallbackImageDataUrl()
    );
}


function useFallbackImage(imageElement) {

    if (!imageElement) {
        return;
    }

    imageElement.onerror = null;

    imageElement.src =
        createFallbackImageDataUrl();
}


function createFallbackImageDataUrl() {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="900"
            height="600"
            viewBox="0 0 900 600"
        >

            <defs>

                <linearGradient
                    id="background"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >

                    <stop
                        offset="0%"
                        stop-color="#0059b3"
                    />

                    <stop
                        offset="100%"
                        stop-color="#00a86b"
                    />

                </linearGradient>

            </defs>

            <rect
                width="900"
                height="600"
                fill="url(#background)"
            />

            <circle
                cx="710"
                cy="135"
                r="72"
                fill="#ffd166"
            />

            <path
                d="M0 430 C150 350 300 500 450 420 C610 335 760 470 900 390 L900 600 L0 600 Z"
                fill="#e9f7ff"
                opacity="0.95"
            />

            <path
                d="M0 485 C170 410 315 555 500 470 C650 400 790 520 900 455 L900 600 L0 600 Z"
                fill="#87d7f5"
                opacity="0.95"
            />

            <text
                x="450"
                y="260"
                text-anchor="middle"
                fill="#ffffff"
                font-family="Arial, Helvetica, sans-serif"
                font-size="44"
                font-weight="700"
            >
                PackageHolidayCompare
            </text>

            <text
                x="450"
                y="320"
                text-anchor="middle"
                fill="#ffffff"
                font-family="Arial, Helvetica, sans-serif"
                font-size="25"
            >
                Holiday image coming soon
            </text>

        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}


// ======================================================
// FORMATTING HELPERS
// ======================================================

function createStars(starCount) {

    const safeCount =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(starCount)
            )
        );

    if (safeCount === 0) {
        return "Unrated";
    }

    return "★".repeat(safeCount);
}


function formatNumber(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString(
        "en-GB",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


function formatDisplayDate(value) {

    if (!value) {
        return "Date unavailable";
    }

    const date =
        new Date(
            `${String(value)
                .slice(0, 10)}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateForInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function normaliseText(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}


function createSafeBookingUrl(value) {

    const url =
        String(
            value || ""
        ).trim();

    if (
        url.startsWith("https://") ||
        url.startsWith("http://")
    ) {
        return escapeAttribute(url);
    }

    return "";
}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHtml(value);
}