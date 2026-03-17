SEP is small Part of the company just to plan, manage and monitor the the schedules and progress updates, in real-time for the Service Engineers and other users 

Home Page 
A Intro Home Page For Non Authenticated User, A short description of SEP and it's Features, And the company Intro and Details 
Signup Page
Sign-up As 
Admin
Engineer
Manager
Executive 
Client (optional for future scaling) 
Sign-up Requirements 
 

User Role (Admin, Engineer, Manager, Executive)
First Name Last Name
Mail-id 
Mobile No
Location/HQ (Head Quarterse)

Profile Page
All user Has their own profile page based on their User role
Where All user can view and edit their profile based on their role 

Engineer Profile 
Engineer after successful sign up can modify and details their profile 
All engineers should update their Equipment/Laser Details on their profile page 
This Laser Details section will be available only to the engineers and it can be viewed by the admin and the manager 

Laser Details Form
Laser Type 
Serial Number 
Tracker (Available/Not Available)
Image upload option


Dashboard 
Engineer Dashboard 
Admin Dashboard 
Manager Dashboard 
Executive Dashboard 
Engineer and Executive Dashboard

Admin Dashboard 
Admin and Manager Dashboard Covers entire system 
If any other user with admin Privileges has a default User dashboard based on their role will be defaulted and admin Dashboard will also be available in a seperate Tab 
Admin and manager can able to view all users profile 

Calendar Views
Day View
Weekly view
Monthly View
Overview for the Month

All Users can Add Cases and Assign Available Engineer to each case 
And cases can also be added without assigning the engineer as unassigned with a proper highlight 
All cases should be highlighted properly based priority and engineer assignment 
And user can set priority for the cases on adding new case or modify later 

Case form 
Date and Time integrated with calendar
Client Name (From Clients Data) or can add new client which will be saved to clients data 
Case Type 
Location
Date and Time integrated with calendar 
Engineer 
Priority 
Notes 

Case Followup and updates 
Only Admin or particular Engineer who is assigned to a particular case can edit or update the case updates 
And the other users like Executive and managers can only view the status and updates and they don't have access to modify it 

Data for case updates and status 
Location Arrived, Respective region, eg: Bangalore, Hyderabad, based on available options.
Reached Centre 
Current Status / In Progress, Completed, Pending, Postponed, Cancelled, Carry forward/Extended.

If Completed / Case Details*
If the Case or the status is changed to completed the engineer is Automatically prompts for the case details form to fill the 
Client Name 
Location 
Patient Details, with multiple patients option for adding more than 1 patient
Name 
Age 
Test 
No of Embryos 
Date, fetched from calendar and also editable 
Embryologist Name
Notes 
Export Option/Download option 
Export/download option, Either for the entire Case Details or only for the Patient Details 

Engineer Status 
Engineers are always travelling between different locations, for example travelling Bangalore to Hyderabad, Hyderabad to Chennai, so in that case they can update their current status in real-time.
Data for Engineer Status 
Travelling / In Transit 
Reached Location based on assignment of upcoming case
Reached Centre
Waiting for Installation 
Installation done 
Uninstallation Done
Case Details 

Executive 
Executives are the persons who follows up with clients and gets the cases, And updates the Manager and engineers about the case.
Each executive has their own clients, Executive can self assign a client under him.
And can assign clients for other executives also

Clients and Client Data 
Clients are not just a single person it is an entity or organisation.
Here in our case, The most of our Clients are IVF Hospitals and fertility 
Here in this case the word client always refers to a Hospital, 
for example Client 1: Motherhood Whitefield, Client 2: Nova Sarjapur 
In our case, most of our Clients are IVF Hospitals and fertility Centres.
Clients are the place where Case is getting originated, 
Here's the clear explanation The client will raise requests for the Laser Component for a procedure for some particular period of time or days to the executives or manager.
Thses requests are either processed by Executives or Managers Directly to update the availability of the Laser.

Now the the the requested laser component will be with Engineers all around India in different locations.
So the requests will reach the Engineers with approval of the manager either by executive or by manager directly.
From this point Engineer will Takeover , followup and update the case details appropriately.
Now Motherhood is the the Hospital name and the following name Whitefield is the respective Area, Whitefield in Bangalore 
All authenticated users can add, view and manage the Client Data where admin can view the person who added the client data.
Clients with disclose option are hidden to other executives other than the one who added

Clients with disclose option are hidden to other executives other than the one who added

Add Client
Clients based on location, /Filter and Search 
Assigning Clients Under Respective Area Executive, admin, manager, 
Client Tab/page

Client Data Form
Client Name 
Location from the Location Data 
Contact Person 
Contact person Designation 
Mobile number
Executive from the Executives Data

Location Data
Location Data can be added and managed by both admin and the manager 
Hyderabad 
Bangalore 
Chennai
Coimbatore 
Mumbai


Workflow / Roadmap 
One engineer can handle one or more cases at one location in a day but can't handle cases at different locations.
Example 
Engineer Arun Can handle upto 3 cases only in Bangalore but can't handle 2 cases 1 at Bangalore and other at Hyderabad on same day 
Sometimes Engineer cannot handle more than one case based on the case timeline and travel time, in that case some other engineer has to come for the other case.
This can be managed by the engineer and the manager with an option of send to location 
If any engineer is set to send to location the status automatically changed to transit on that particular time 
And if an engineer is assigned to a case already on a particular time period and if someone is trying to assign him to another case at the same timeline show a error message like engineer already assigned to case( here replace case with the case name based on the assignment)
Allow multiple case assignment to an engineer and highlight it with a warning ⚠️ symbol 
Engineer can apply leave and the manager can approve leave.
If someone tries to add case in the timeline where engineer is in leave or applied for leave show a warning message like Engineer on leave and assign case with warning sign unless approved by the manager 

Users And Permission 
Store User and profiles Based on Roles 
All Users can view, add, and manage cases 
Only Admin and manager can Approve leave, and can approve Engineer and Executive Sign up
Only Manager and Admin can view the Engineer status 
Engineer can Update Their status 
Engineer Admin Executive and Manager can View  executive Details And Their Clients Details 