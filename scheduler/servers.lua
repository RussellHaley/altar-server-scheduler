-- Define servers with their available roles and weekday availability
local servers = {
    { name = "Fr. Lee Kenyon", roles = {"CE", "DE"}, available_days = {"Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"} },
    { name = "Mgr. Carl Reid", roles = {"CE", "DE", "SD"}, available_days = {"Tuesday", "Thursday", "Saturday", "Sunday"} },
    { name = "Dominic Kenyon", roles = {"MC", "SD", "AC", "TH"}, available_days = {"Monday", "Friday", "Saturday", "Sunday"} },
    { name = "Wendell Clanton", roles = {"MC", "AC", "TH"}, available_days = {"Tuesday", "Thursday", "Saturday", "Sunday"} },
    { name = "Kevin Kirkwood", roles = {"MC", "AC", "TH"}, available_days = {"Tuesday", "Wednesday", "Thursday"} },
    { name = "James Shaw", roles = {"CR", "TB"}, available_days = {"Sunday"} },
    { name = "Russell Haley", roles = {"CR", "TB"}, available_days = {"Sunday"} },
    { name = "Craig Welburn", roles = {"AC", "CR", "TB"}, available_days = {"Sunday"} },
    { name = "Gregory Bartle", roles = {"AC", "TH"}, available_days = {"Sunday"} },
    { name = "Peter Bartle", roles = {"BB"}, available_days = {"Sunday"} },
    { name = "Joseph Bartle", roles = {"BB"}, available_days = {"Sunday"} },
    { name = "Joseph Haley", roles = {"BB", "TB"}, available_days = {"Sunday"} },
    { name = "William Haley", roles = {"TB", "VI"}, available_days = {"Sunday"} },
    { name = "William Snowden", roles = {"TB"}, available_days = {"Sunday"} },
    { name = "Roman Spainer", roles = {"MC", "AC"}, available_days = {"Monday", "Tuesday", "Sunday"} },
    { name = "William Haines", roles = {"TB"}, available_days = {"Sunday"} },
    { name = "Chris Logan", roles = {"CR"}, available_days = {"Sunday"} },
    { name = "Nia ", roles = {"BB"}, available_days = {"Sunday"} },
    { name = "Nathan McQuay", roles = {"AC", "TH"}, available_days = {"Sunday"} },
    { name = "Dan McQuay", roles = {"VI", "AC"}, available_days = {"Sunday"} },
    { name = "Joseph Potter", roles = {"TH"}, available_days = {"Sunday"} },
	
	
}

return servers