-- Define Mass configurations with specific roles required
local masses = {
    { 
        name = "Solemn High Mass", 
        vestment = "Gold", 
        cotta = "Lace", 
        day = "Sunday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "DE", count = 1 }, -- Deacon
            { role = "SD", count = 1 }, -- Subdeacon
            { role = "MC", count = 1 }, -- Master of Ceremonies
            { role = "TH", count = 1 }, -- Thurifer
            { role = "BB", count = 1 }, -- Boat Bearer
            { role = "AC", count = 2 }, -- Acolyte (2 needed)
            { role = "VI", count = 2 }, -- Vimpe (2 needed)
            { role = "CR", count = 1 }, -- Crucifer
            { role = "TB", count = 4 }  -- Torch Bearer (2 needed)
        }
    },
	{
		name = "Sung Mass", 
        vestment = "White", 
        cotta = "Plain", 
        day = "Sunday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "MC", count = 1 }, -- Master of Ceremonies
            { role = "TH", count = 1 }, -- Thurifer
            { role = "BB", count = 1 }, -- Boat Bearer
            { role = "AC", count = 2 }, -- Acolyte (2 needed)
            { role = "CR", count = 1 }, -- Crucifer
            { role = "TB", count = 2 }  -- Torch Bearer (2 needed)
        }
    },
    { 
        name = "Daily Mass", 
        vestment = "Green", 
        cotta = "Plain", 
        day = "Monday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 1 }  -- Acolyte
        }
    },
    { 
        name = "Daily Mass", 
        vestment = "Green", 
        cotta = "Plain", 
        day = "Tuesday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 1 }  -- Acolyte
        }
    },
    { 
        name = "Daily Mass", 
        vestment = "Purple", 
        cotta = "Plain", 
        day = "Wednesday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 1 }  -- Acolyte
        }
    },
    { 
        name = "Daily Mass", 
        vestment = "Green", 
        cotta = "Plain", 
        day = "Thursday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 1 }  -- Acolyte
        }
    },
    { 
        name = "Daily Mass", 
        vestment = "Green", 
        cotta = "Plain", 
        day = "Friday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 1 }  -- Acolyte
        }
    },
    { 
        name = "Solemn Mass", 
        vestment = "White", 
        cotta = "Plain", 
        day = "Saturday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 2 }  -- Acolyte
        }
    },
	{ 
        name = "Reqium Mass", 
        vestment = "Black", 
        cotta = "Lace", 
        day = "Sunday",
        roles_needed = {
            { role = "CE", count = 1 }, -- Celebrant
            { role = "AC", count = 2 },  -- Acolyte
            { role = "TH", count = 1 },  -- Thurifer
            { role = "BB", count = 1 },  -- Boat Bearer
            { role = "CR", count = 1 },  -- Crucifer
            { role = "TB", count = 2 }  -- Tourch Bearer
        }
    }
}

return masses