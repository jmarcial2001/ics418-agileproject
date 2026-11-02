// Ka Lama kiosk content. Room info, directory and schedule were pulled from the
// old "Ka Lama Building Map Project" slides. Anything marked VERIFY needs a check.
window.KIOSK = {
    config: {
        buildingName: "Ka Lama",
        kioskNodeId: "k1",                    // kiosk sits next to the main stairs on floor 1
        kioskNodes: { 1: "k1", 2: "k2" },     // one per screen. 2nd-floor screen opens index.html?kiosk=2
        idleSeconds: 90,
        eventsUrl: "https://example.com/events",               // TODO
        cafeteriaUrl: "https://example.com/menu",              // TODO: full menu link
        campusMapUrl: "https://www.maui.hawaii.edu/assets/PDF/Campus-Map.pdf",              // TODO: exact campus map page
        // Live Google map on the Campus tab. This keyless link works as-is (satellite view of campus).
        // For labeled building pins, make a Google My Map and paste its embed link here instead.
        campusMapEmbedUrl: "https://maps.google.com/maps?q=310+W+Kaahumanu+Ave,+Kahului,+HI+96732&t=h&z=17&output=embed",
        campusAddress: "UH Maui College, 310 W Kaahumanu Ave, Kahului, HI 96732"   // VERIFY
    },

    // MOCK menu. Replace with the real thing (Mon-Thu). Station names are from news articles.
    menu: {
        note: "Sample menu, not final",
        hours: "Mon–Thu, 11:00 AM – 1:00 PM",   // VERIFY
        days: {
            M: [{ station: "Paniolo Grill", items: ["Teriyaki chicken plate", "Garden burger"] },
            { station: "World Plate", items: ["Chicken adobo", "Steamed rice", "Garlic green beans"] },
            { station: "Soup & Salad Bar", items: ["Minestrone", "Caesar salad"] }],
            T: [{ station: "Paniolo Grill", items: ["BBQ pulled pork sandwich", "Fries"] },
            { station: "World Plate", items: ["Beef stew", "Mac salad"] },
            { station: "Soup & Salad Bar", items: ["Chicken noodle soup", "Garden salad"] }],
            W: [{ station: "Paniolo Grill", items: ["Cheeseburger", "Hummus platter"] },
            { station: "World Plate", items: ["Kalua pork", "Rice", "Lomi salad"] },
            { station: "Soup & Salad Bar", items: ["Tomato soup", "Pasta salad"] }],
            Th: [{ station: "Paniolo Grill", items: ["Fried chicken sandwich", "Wedges"] },
            { station: "World Plate", items: ["Vegetable curry", "Rice"] },
            { station: "Soup & Salad Bar", items: ["Clam chowder", "Fruit salad"] }]
        }
    },

    // Campus buildings for the "take directions on your phone" QR.
    // TODO: for each building, right-click it in Google Maps, click the coordinates to copy them,
    // and paste into lat/lng. Until then it searches by name (less exact).
    campusBuildings: [
        { id: "kalama", name: "Ka Lama", lat: null, lng: null },
        { id: "library", name: "Ka Lama Library", lat: null, lng: null },
        { id: "llc", name: "Library & Learning Commons", lat: null, lng: null },
        { id: "paina", name: "Pāʻina Market (cafeteria)", lat: null, lng: null, search: "Paina Market" },
        { id: "kaaike", name: "Kaʻaʻike", lat: null, lng: null },
        { id: "ike", name: "ʻIke", lat: null, lng: null },
        { id: "laulima", name: "Laulima", lat: null, lng: null },
        { id: "kupaa", name: "Kupaʻa", lat: null, lng: null },
        { id: "heona", name: "Heona", lat: null, lng: null },
        { id: "pilina", name: "Pilina", lat: null, lng: null },
        { id: "hookipa", name: "Hoʻokipa", lat: null, lng: null },
        { id: "hoala", name: "Hoʻāla", lat: null, lng: null }
      ],
    // Floor plan images + their pixel size. All coordinates below are in these pixels.
    floors: {
        1: { img: "img/floor1.jpg", w: 862, h: 571 },
        2: { img: "img/floor2.jpg", w: 805, h: 622 }
    },

    // Clickable rooms: x,y,w,h in floor-image pixels. "node" = hallway point at the door.
    // Small rooms go LAST in each floor so they sit on top of the bigger ones.
    rooms: [
        // ---------- FLOOR 1: west wing ----------
        { id: "124", floor: 1, x: 38, y: 147, w: 55, h: 41, node: "wc124", name: "Administrative Assistant" },
        { id: "123", floor: 1, x: 38, y: 188, w: 55, h: 43, node: "wc123", name: "Office" },
        { id: "122", floor: 1, x: 38, y: 231, w: 55, h: 42, node: "wc122", name: "Office" },
        { id: "121", floor: 1, x: 38, y: 273, w: 55, h: 42, node: "w300", name: "Office" },
        { id: "120", floor: 1, x: 38, y: 315, w: 55, h: 42, node: "wc120", name: "Human Services Program" },
        { id: "119", floor: 1, x: 38, y: 357, w: 55, h: 42, node: "wc119", name: "Office" },
        { id: "118", floor: 1, x: 38, y: 399, w: 55, h: 42, node: "wc118", name: "Office" },
        { id: "117", floor: 1, x: 38, y: 441, w: 55, h: 42, node: "wc117", name: "Office" },
        // bottom row
        { id: "116", floor: 1, x: 130, y: 483, w: 51, h: 50, node: "b116", name: "Office" },
        { id: "115", floor: 1, x: 181, y: 483, w: 46, h: 50, node: "b115", name: "Office" },
        { id: "114", floor: 1, x: 227, y: 483, w: 46, h: 50, node: "b114", name: "Office" },
        { id: "113", floor: 1, x: 273, y: 483, w: 46, h: 50, node: "b113", name: "Office" },
        { id: "112", floor: 1, x: 319, y: 483, w: 46, h: 50, node: "b112", name: "Office" },
        { id: "111", floor: 1, x: 365, y: 483, w: 44, h: 50, node: "b111", name: "Office" },
        // middle block
        { id: "125", floor: 1, x: 116, y: 147, w: 62, h: 48, node: "wc124", name: "Hōkūpaʻa Office" },
        { id: "126", floor: 1, x: 116, y: 195, w: 62, h: 43, node: "wc123", name: "STEM Instructor Office" },
        { id: "127", floor: 1, x: 116, y: 238, w: 62, h: 45, node: "wc122", name: "Office" },
        { id: "107", floor: 1, x: 178, y: 147, w: 122, h: 136, node: "t107", name: "Classroom" },
        { id: "M", floor: 1, x: 302, y: 148, w: 80, h: 57, node: "rmN", name: "Men's Restroom", label: "M" },
        { id: "W", floor: 1, x: 302, y: 226, w: 80, h: 57, node: "rmN", name: "Women's Restroom", label: "W" },
        { id: "109", floor: 1, x: 118, y: 318, w: 112, h: 142, node: "t109", name: "Classroom" },
        { id: "108", floor: 1, x: 230, y: 318, w: 110, h: 142, node: "t108", name: "Classroom" },
        { id: "106", floor: 1, x: 340, y: 318, w: 68, h: 107, node: "tm", name: "Veterans Resource Center" },
        { id: "110", floor: 1, x: 340, y: 425, w: 68, h: 35, node: "tm", name: "Office" },
        // east wing, top row
        { id: "130", floor: 1, x: 456, y: 22, w: 47, h: 48, node: "n130", name: "Office" },
        { id: "131", floor: 1, x: 503, y: 22, w: 46, h: 48, node: "n131", name: "UH Community Colleges (VP Office)" },
        { id: "132", floor: 1, x: 549, y: 22, w: 47, h: 48, node: "n132", name: "Office" },
        { id: "133", floor: 1, x: 596, y: 22, w: 44, h: 48, node: "n133", name: "Office" },
        { id: "134", floor: 1, x: 640, y: 22, w: 46, h: 48, node: "n134", name: "Office" },
        { id: "135", floor: 1, x: 686, y: 22, w: 44, h: 48, node: "n135", name: "Office" },
        // east wing, middle + bottom
        { id: "101", floor: 1, x: 456, y: 90, w: 81, h: 95, node: "r101", name: "Business Division Office" },
        { id: "103", floor: 1, x: 587, y: 90, w: 235, h: 132, node: "r103", name: "Classroom" },
        { id: "102", floor: 1, x: 520, y: 262, w: 78, h: 142, node: "r102", name: "Conference Room / Mailroom" },
        { id: "104A", floor: 1, x: 598, y: 262, w: 142, h: 142, node: "r104a", name: "Classroom" },
        { id: "104B", floor: 1, x: 740, y: 262, w: 82, h: 142, node: "r104b", name: "Classroom" },
        // tiny rooms last
        { id: "101A", floor: 1, x: 537, y: 90, w: 50, h: 48, node: "n132", name: "Room" },
        { id: "105", floor: 1, x: 540, y: 138, w: 47, h: 84, node: "r102", name: "Electric Room" },
        { id: "137", floor: 1, x: 497, y: 185, w: 40, h: 37, node: "r101", name: "Electric Room" },
        { id: "103A", floor: 1, x: 755, y: 70, w: 67, h: 20, node: "sNE1", name: "Room" },

        // ---------- FLOOR 2 ----------
        { id: "230", floor: 2, x: 420, y: 78, w: 44, h: 49, node: "n230", name: "Social Science" },
        { id: "231", floor: 2, x: 464, y: 78, w: 39, h: 49, node: "n231", name: "Office" },
        { id: "232", floor: 2, x: 503, y: 78, w: 39, h: 49, node: "n232", name: "Office" },
        { id: "233", floor: 2, x: 542, y: 78, w: 38, h: 49, node: "n233", name: "Maui United Way" },
        { id: "234", floor: 2, x: 580, y: 78, w: 37, h: 49, node: "n234", name: "Business & Hospitality" },
        { id: "235", floor: 2, x: 617, y: 78, w: 38, h: 49, node: "n235", name: "Empty room" },
        { id: "201", floor: 2, x: 422, y: 148, w: 133, h: 115, node: "e201", name: "Admissions & Records / Secretarial Lab" },
        { id: "203", floor: 2, x: 570, y: 148, w: 158, h: 115, node: "e203", name: "Business Lab" },
        { id: "202", floor: 2, x: 480, y: 293, w: 147, h: 122, node: "e202", name: "Accounting Lab" },
        { id: "204", floor: 2, x: 627, y: 293, w: 125, h: 122, node: "e204", name: "Accounting Lab" },
        { id: "209", floor: 2, x: 62, y: 200, w: 63, h: 100, node: "w209", name: "Empty room" },
        { id: "207", floor: 2, x: 125, y: 200, w: 183, h: 113, node: "w207", name: "Room" },
        { id: "M2", floor: 2, x: 310, y: 200, w: 72, h: 55, node: "rest2", name: "Men's Restroom", label: "M" },
        { id: "W2", floor: 2, x: 310, y: 257, w: 72, h: 56, node: "rest2", name: "Women's Restroom", label: "W" },
        { id: "208", floor: 2, x: 125, y: 345, w: 127, h: 123, node: "w208", name: "Room" },
        { id: "206", floor: 2, x: 252, y: 345, w: 130, h: 123, node: "w206", name: "Room" },
        { id: "221", floor: 2, x: 62, y: 303, w: 43, h: 37, node: "wA", name: "Room" },
        { id: "220", floor: 2, x: 62, y: 340, w: 43, h: 37, node: "w220", name: "Comm Room" },
        { id: "219", floor: 2, x: 62, y: 377, w: 43, h: 37, node: "w219", name: "Business Hospitality" },
        { id: "218", floor: 2, x: 62, y: 414, w: 43, h: 37, node: "w218", name: "Business, Management" },
        { id: "217", floor: 2, x: 62, y: 451, w: 43, h: 36, node: "w217", name: "Business Administration Lectures" },
        { id: "216", floor: 2, x: 146, y: 490, w: 42, h: 45, node: "s216", name: "Empty room" },
        { id: "215", floor: 2, x: 188, y: 490, w: 38, h: 45, node: "s215", name: "Hawaiian Studies" },
        { id: "214", floor: 2, x: 226, y: 490, w: 36, h: 45, node: "s214", name: "Hawaiian Studies" },
        { id: "213", floor: 2, x: 262, y: 490, w: 40, h: 45, node: "s213", name: "Empty room" },
        { id: "212", floor: 2, x: 302, y: 490, w: 39, h: 45, node: "s212", name: "Room" },
        { id: "211", floor: 2, x: 341, y: 490, w: 41, h: 45, node: "s211", name: "Empty room" },
        { id: "203A", floor: 2, x: 567, y: 183, w: 21, h: 49, node: "e203", name: "Room" }
    ],

    // Walkable points (floor-image pixels). Links are made two-way automatically.
    // Cross-floor links (stairs) are s1<->s2, sNE1<->sNE2, sSW1<->sSW2.
    nodes: [
        // ---- floor 1 ----
        { id: "k1", floor: 1, x: 440, y: 372, links: ["s1", "j1"] },       // KIOSK
        { id: "s1", floor: 1, x: 490, y: 372, links: ["s2"] },            // main stairs
        { id: "j1", floor: 1, x: 440, y: 300, links: ["tm", "jr"] },
        { id: "tm", floor: 1, x: 394, y: 300, links: ["t108", "rmN"] },
        { id: "rmN", floor: 1, x: 394, y: 215, links: [] },
        { id: "t108", floor: 1, x: 285, y: 300, links: ["t107"] },
        { id: "t107", floor: 1, x: 205, y: 300, links: ["t109"] },
        { id: "t109", floor: 1, x: 150, y: 300, links: ["w300"] },
        { id: "w300", floor: 1, x: 105, y: 300, links: ["wc122", "wc120"] },
        { id: "wc124", floor: 1, x: 105, y: 167, links: ["wc123"] },
        { id: "wc123", floor: 1, x: 105, y: 210, links: ["wc122"] },
        { id: "wc122", floor: 1, x: 105, y: 252, links: [] },
        { id: "wc120", floor: 1, x: 105, y: 336, links: ["wc119"] },
        { id: "wc119", floor: 1, x: 105, y: 378, links: ["wc118"] },
        { id: "wc118", floor: 1, x: 105, y: 420, links: ["wc117"] },
        { id: "wc117", floor: 1, x: 105, y: 471, links: ["b116", "sSW1"] },
        { id: "sSW1", floor: 1, x: 74, y: 510, links: ["sSW2"] },
        { id: "b116", floor: 1, x: 155, y: 471, links: ["b115"] },
        { id: "b115", floor: 1, x: 204, y: 471, links: ["b114"] },
        { id: "b114", floor: 1, x: 250, y: 471, links: ["b113"] },
        { id: "b113", floor: 1, x: 296, y: 471, links: ["b112"] },
        { id: "b112", floor: 1, x: 342, y: 471, links: ["b111"] },
        { id: "b111", floor: 1, x: 387, y: 471, links: [] },
        { id: "jr", floor: 1, x: 440, y: 242, links: ["r101", "tc0"] },
        { id: "r101", floor: 1, x: 497, y: 242, links: ["r102"] },
        { id: "r102", floor: 1, x: 559, y: 242, links: ["r103"] },
        { id: "r103", floor: 1, x: 600, y: 242, links: ["r104a"] },
        { id: "r104a", floor: 1, x: 665, y: 242, links: ["r104b"] },
        { id: "r104b", floor: 1, x: 790, y: 242, links: [] },
        { id: "tc0", floor: 1, x: 445, y: 80, links: ["n130"] },
        { id: "n130", floor: 1, x: 480, y: 80, links: ["n131"] },
        { id: "n131", floor: 1, x: 526, y: 80, links: ["n132"] },
        { id: "n132", floor: 1, x: 572, y: 80, links: ["n133"] },
        { id: "n133", floor: 1, x: 618, y: 80, links: ["n134"] },
        { id: "n134", floor: 1, x: 663, y: 80, links: ["n135"] },
        { id: "n135", floor: 1, x: 708, y: 80, links: ["sNE1"] },
        { id: "sNE1", floor: 1, x: 790, y: 80, links: ["sNE2"] },

        // ---- floor 2 ----
        { id: "s2", floor: 2, x: 450, y: 380, links: ["k2"] },
        { id: "k2", floor: 2, x: 401, y: 380, links: ["v3", "v5"] },
        { id: "v1", floor: 2, x: 401, y: 137, links: ["v2", "n230"] },
        { id: "v2", floor: 2, x: 401, y: 278, links: ["v3", "e201"] },
        { id: "v3", floor: 2, x: 401, y: 329, links: ["rest2"] },
        { id: "v5", floor: 2, x: 401, y: 478, links: ["s211"] },
        { id: "n230", floor: 2, x: 442, y: 137, links: ["n231"] },
        { id: "n231", floor: 2, x: 483, y: 137, links: ["n232"] },
        { id: "n232", floor: 2, x: 522, y: 137, links: ["n233"] },
        { id: "n233", floor: 2, x: 561, y: 137, links: ["n234"] },
        { id: "n234", floor: 2, x: 598, y: 137, links: ["n235"] },
        { id: "n235", floor: 2, x: 636, y: 137, links: ["sNE2"] },
        { id: "sNE2", floor: 2, x: 717, y: 137, links: [] },
        { id: "e201", floor: 2, x: 490, y: 278, links: ["e202"] },
        { id: "e202", floor: 2, x: 545, y: 278, links: ["e203"] },
        { id: "e203", floor: 2, x: 650, y: 278, links: ["e204"] },
        { id: "e204", floor: 2, x: 700, y: 278, links: [] },
        { id: "rest2", floor: 2, x: 350, y: 329, links: ["w206"] },
        { id: "w206", floor: 2, x: 310, y: 329, links: ["w207"] },
        { id: "w207", floor: 2, x: 235, y: 329, links: ["w208"] },
        { id: "w208", floor: 2, x: 180, y: 329, links: ["wA"] },
        { id: "wA", floor: 2, x: 115, y: 329, links: ["w209", "w220"] },
        { id: "w209", floor: 2, x: 115, y: 260, links: [] },
        { id: "w220", floor: 2, x: 115, y: 358, links: ["w219"] },
        { id: "w219", floor: 2, x: 115, y: 395, links: ["w218"] },
        { id: "w218", floor: 2, x: 115, y: 432, links: ["w217"] },
        { id: "w217", floor: 2, x: 115, y: 478, links: ["s216", "sSW2"] },
        { id: "sSW2", floor: 2, x: 88, y: 512, links: [] },
        { id: "s216", floor: 2, x: 167, y: 478, links: ["s215"] },
        { id: "s215", floor: 2, x: 207, y: 478, links: ["s214"] },
        { id: "s214", floor: 2, x: 244, y: 478, links: ["s213"] },
        { id: "s213", floor: 2, x: 282, y: 478, links: ["s212"] },
        { id: "s212", floor: 2, x: 321, y: 478, links: ["s211"] },
        { id: "s211", floor: 2, x: 361, y: 478, links: [] }
    ],

    // People. Copied from the old slides (UH directory info). VERIFY before launch.
    directory: [
        { name: "Paul Thornton, PhD", title: "Assoc. Professor, Psychology", room: "110", email: "pdt@hawaii.edu", phone: "(808) 984-3281" },
        { name: "Julie Powers", title: "Professor, Early Childhood Ed; Chair, Social Science", room: "111", email: "juliepow@hawaii.edu", phone: "(808) 984-3291" },
        { name: "Gemma Nicholl Medina", title: "Asst. Professor, Early Childhood Ed", room: "112", email: "nicholl@hawaii.edu", phone: "(808) 984-3208" },
        { name: "Leanne Higa", title: "Instructor, Allied Health; Dental Hygiene Coordinator", room: "113", email: "higalea@hawaii.edu", phone: "" },   // VERIFY phone (slide had a typo)
        { name: "Tim Botkin", title: "Asst. Professor, Sustainable Science Mgmt", room: "114", email: "botkin@hawaii.edu", phone: "(808) 984-3322" },
        { name: "Dr. Meagan Jones Gray", title: "Sustainable Science", room: "115", email: "meaganj@hawaii.edu", phone: "(808) 984-3709" },
        { name: "Charlie Schlather", title: "Assoc. Professor, Social Sciences", room: "117", email: "tcs7@hawaii.edu", phone: "(808) 984-3217" },
        { name: "Ron St. John", title: "Asst. Professor, Business / Communication / Speech", room: "119", email: "rsj@hawaii.edu", phone: "(808) 984-3341" },
        { name: "Selen LeGare", title: "Human Services Program", room: "120", email: "", phone: "" },
        { name: "Melissa Kirkendall (Dr. K)", title: "Anthropology", room: "121", email: "kirkenda@hawaii.edu", phone: "" },
        { name: "Liping Liu", title: "Professor, Hospitality & Tourism", room: "122", email: "lipingl@hawaii.edu", phone: "(808) 984-3328" },
        { name: "Liana Horovitz", title: "History Instructor", room: "123", email: "liana@hawaii.edu", phone: "(808) 984-3275" },
        { name: "Bobbie Rucker", title: "Administrative Assistant", room: "124", email: "brucker@hawaii.edu", phone: "(808) 984-3365" },
        { name: "Velma Panlasigui", title: "Project Director, Hōkūpaʻa", room: "125", email: "vpanlasi@hawaii.edu", phone: "(808) 984-3755" },
        { name: "Cathy Yago", title: "Early College Specialist, Hōkūpaʻa", room: "125", email: "cayago@hawaii.edu", phone: "(808) 984-3461" },
        { name: "Tom Beran", title: "STEM Instructor", room: "126", email: "", phone: "" },
        { name: "Marshall Norman", title: "UH Office of the VP for Community Colleges", room: "131", email: "", phone: "" },
        { name: "Papaikaniʻau Kaiʻanui", title: "Hawaiian Studies", room: "214", email: "papikan@hawaii.edu", phone: "808-984-3756" },
        { name: "Aubrey Matsuura", title: "Hawaiian Studies", room: "215", email: "aubreykm@hawaii.edu", phone: "808-984-3289" },
        { name: "Gil Logan", title: "Business, Management", room: "218", email: "glogan@hawaii.edu", phone: "808-984-3344" },
        { name: "Lorelle Solanzo Peros", title: "Business Hospitality", room: "219", email: "lorelle@hawaii.edu", phone: "808-984-3343" },
        { name: "Rosiana (Nani) Azman", title: "Social Science", room: "230", email: "rosiana@hawaii.edu", phone: "808-984-3259" },
        { name: "Vincent Domingo", title: "Business and Hospitality", room: "234", email: "vdomingo@hawaii.edu", phone: "808-984-3353" },
        { name: "Veterans Resource Center", title: "Tue/Wed/Thu 9:00 AM – 1:00 PM", room: "106", email: "", phone: "984-3242" }
    ],

    // Classes. days: M T W Th F. 24h times. Fall 2025 data from the slides, VERIFY for current term.
    schedule: [
        // Room 103
        { crn: "45783", course: "MUS 121B", instructor: "Goedecke", days: ["M", "W"], start: "10:30", end: "11:45", room: "103" },
        { crn: "45943", course: "MUS 122B", instructor: "Goedecke", days: ["M", "W"], start: "10:30", end: "11:45", room: "103" },
        { crn: "45420", course: "COM 145", instructor: "Ruppenthal", days: ["M", "W"], start: "12:00", end: "13:15", room: "103" },
        { crn: "45260", course: "COM 145", instructor: "Ruppenthal", days: ["M", "W"], start: "15:00", end: "16:15", room: "103" },
        { crn: "45399", course: "MUS 107", instructor: "Goedecke", days: ["T", "Th"], start: "12:00", end: "13:15", room: "103" },
        { crn: "45781", course: "MUS 132", instructor: "Donaghy", days: ["W"], start: "17:30", end: "20:30", room: "103" },
        { crn: "45784", course: "MUS 114", instructor: "Goedecke", days: ["Th"], start: "17:30", end: "20:30", room: "103" },
        // Room 104A
        { crn: "45792", course: "HUM 100", instructor: "Mandelstam", days: ["M", "W"], start: "09:00", end: "10:15", room: "104A" },
        { crn: "45948", course: "PSY 250", instructor: "Thornton", days: ["M", "W"], start: "10:30", end: "11:45", room: "104A" },
        { crn: "45350", course: "PSY 100", instructor: "Thornton", days: ["M", "W"], start: "12:00", end: "13:15", room: "104A" },
        { crn: "45347", course: "PSY 100", instructor: "Thornton", days: ["M", "W"], start: "13:30", end: "14:45", room: "104A" },
        { crn: "46055", course: "PHIL 101", instructor: "Mandelstam", days: ["T", "Th"], start: "09:00", end: "10:15", room: "104A" },
        { crn: "45944", course: "MUS 121D", instructor: "Katz", days: ["T", "Th"], start: "10:30", end: "11:45", room: "104A" },  // VERIFY end time (slide typo)
        { crn: "45790", course: "REL 150", instructor: "Mandelstam", days: ["T", "Th"], start: "12:00", end: "13:15", room: "104A" },
        { crn: "46077", course: "IS 104B", instructor: "Thornton", days: ["Th"], start: "13:30", end: "14:20", room: "104A" },
        { crn: "46000", course: "SCI 168", instructor: "Whitney", days: ["T", "Th"], start: "16:30", end: "17:45", room: "104A" },  // slide also lists 109, VERIFY
        // Room 104B
        { crn: "45400", course: "MUS 121C", instructor: "Katz", days: ["T", "Th"], start: "09:00", end: "10:15", room: "104B" },
        { crn: "45565", course: "MUS 122C", instructor: "Katz", days: ["T", "Th"], start: "09:00", end: "10:15", room: "104B" },
        { crn: "45945", course: "MUS 221C", instructor: "Katz", days: ["T", "Th"], start: "09:00", end: "10:15", room: "104B" },
        // Room 107
        { crn: "45106", course: "MGT 120", instructor: "", days: ["M"], start: "12:00", end: "13:15", room: "107" },
        { crn: "46075", course: "IS 104B", instructor: "", days: ["T"], start: "09:00", end: "09:50", room: "107" },
        { crn: "45962", course: "ACC 124", instructor: "", days: ["T"], start: "10:30", end: "11:45", room: "107" },
        { crn: "45122", course: "ACC 202", instructor: "", days: ["T"], start: "13:30", end: "14:45", room: "107" },
        { crn: "45121", course: "ACC 201", instructor: "", days: ["T"], start: "18:00", end: "21:00", room: "107" },
        { crn: "45119", course: "ACC 132", instructor: "", days: ["W"], start: "13:30", end: "14:45", room: "107" },
        // Room 109
        { crn: "45178", course: "ANTH 151", instructor: "Kirkendall", days: ["M", "W"], start: "10:30", end: "11:45", room: "109" },
        { crn: "45987", course: "SSM 496", instructor: "Jones", days: ["M", "W"], start: "12:00", end: "13:15", room: "109" }
    ]
};