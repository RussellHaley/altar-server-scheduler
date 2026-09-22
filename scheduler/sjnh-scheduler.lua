local M = require 'moses' -- Load Moses library

local masses = dofile('./mass_definitions.lua')

local roles = dofile('./role_definitions.lua')

local servers = dofile('./servers.lua')

-- Function to check if a server is available for a given day
local function isAvailable(server, day)
    return M.contains(server.available_days, day)
end

-- Function to check if a server can perform a specific role
local function canServeRole(server, roleCode)
    return M.contains(server.roles, roleCode)
end

-- Function to assign servers to specific roles for a mass
local function assignServersToMass(mass)
    if type(mass) ~= "table" then
        print("Error: mass is not a table, got: ", mass)
        return { mass = {}, assignments = {}, note = "Error: Invalid mass data" }
    end

    -- Resulting assignments: list of {role, server, count_assigned}
    local assignments = {}
    local note = "Fully staffed"
    local usedServers = {} -- Track assigned servers to avoid double-booking within a mass

    -- Iterate over each required role and count
    for _, roleReq in ipairs(mass.roles_needed) do
        local roleCode = roleReq.role
        local countNeeded = roleReq.count
        local countAssigned = 0
        local assignedServers = {}

        -- Find available servers for this role
        local availableServers = {}
        for _, server in ipairs(servers) do
            if isAvailable(server, mass.day) and canServeRole(server, roleCode) and not usedServers[server.name] then
                table.insert(availableServers, server)
            end
        end

        -- Shuffle for random assignment
        local shuffledServers = M.shuffle(availableServers)

        -- Assign up to the required count
        for i = 1, math.min(countNeeded, #shuffledServers) do
            local server = shuffledServers[i]
            table.insert(assignedServers, server)
            usedServers[server.name] = true
            countAssigned = countAssigned + 1
        end

        -- Add to assignments
        table.insert(assignments, { role = roleCode, servers = assignedServers, count_assigned = countAssigned, count_needed = countNeeded })

        -- Update note if not fully staffed for this role
        if countAssigned < countNeeded then
            note = "Not enough servers for some roles"
        end
    end

    return { mass = mass, assignments = assignments, note = note }
end

-- Generate the schedule for all masses
local function generateSchedule()
    local schedule = {}
    for i, mass in ipairs(masses) do
        -- print("Processing mass #" .. i .. " for day: " .. (mass.day or "unknown"))
        local assignment = assignServersToMass(mass)
        table.insert(schedule, assignment)
    end
    return schedule
end

local function printScheduleCSV(schedule)
	for _, entry in ipairs(schedule) do
        local mass = entry.mass
		if type(mass) == "table" and mass.day then
            print(string.format("\nDay: %s | Mass: %s | Vestment: %s | Cotta: %s", mass.day, mass.name, mass.vestment, mass.cotta))
			for _, assignment in ipairs(entry.assignments) do
				for _, r in ipairs(roles) do
					if r.code == assignment.role then
						roleName = r.name
						break
					end
				end
				if #assignment.servers > 0 then
					for i, server in ipairs(assignment.servers) do
						print(string.format("    %d. %s: %s (Roles: %s)", i,roleName, server.name, table.concat(server.roles, ", ")))
						end
				else
					print("    None assigned.")
				end
			end
			 print("Note: " .. entry.note)
		end 
	end
end
-- Pretty print the schedule
local function printScheduleVerbose(schedule)
    print("=== Catholic Mass Schedule ===")
    for _, entry in ipairs(schedule) do
        local mass = entry.mass
        if type(mass) == "table" and mass.day then
            print(string.format("\nDay: %s | Mass: %s | Vestment: %s | Cotta: %s",
                mass.day, mass.name, mass.vestment, mass.cotta))
            print("Assigned Roles and Servers:")
            for _, assignment in ipairs(entry.assignments) do
                -- Look up role name from code
                local roleName = "Unknown"
                for _, r in ipairs(roles) do
                    if r.code == assignment.role then
                        roleName = r.name
                        break
                    end
                end
                print(string.format("  Role: %s (Needed: %d, Assigned: %d)", 
                    roleName, assignment.count_needed, assignment.count_assigned))
                if #assignment.servers > 0 then
                    for i, server in ipairs(assignment.servers) do
                        print(string.format("    %d. %s (Roles: %s)", i, server.name, table.concat(server.roles, ", ")))
                    end
                else
                    print("    None assigned.")
                end
            end
            print("Note: " .. entry.note)
        else
            print("\nError: Invalid mass data in schedule entry")
        end
    end
end

-- Set random seed for reproducibility (optional)
math.randomseed(os.time())

-- Generate and display the schedule
local schedule = generateSchedule()
-- printSchedule(schedule)
 printScheduleCSV(schedule)