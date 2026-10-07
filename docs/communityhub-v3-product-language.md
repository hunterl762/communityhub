# CommunityHub V3 Product Language

Use plain operational language and avoid inflated AI/SaaS copy inside the application.

## Preferred labels

| Generic/old label | V3 label | Notes |
| --- | --- | --- |
| Dashboard | Command Center | Authenticated operational home only |
| Members / Personnel | People | Use Personnel where a department specifically requires it |
| Automation | Workflows | Product feature may be branded CommunityHub Flow |
| Statistics / Analytics | Insights | Use Analytics when technically clearer |
| Server Status / API pages | Integrations | Consolidated operational area |
| Admin Panel | Administration | Keep existing routes for compatibility |
| Tablet | CommunityHub In-Game | Use F6 or `/hub` in setup documentation |

## Voice

Prefer:
- `3 reports require review.`
- `FiveM heartbeat is 2 minutes old.`
- `Jordan started duty at 21:14.`
- `No training is scheduled.`
- `This action requires Management access.`

Avoid:
- `Unlock the power of your community!`
- `Supercharge your workflow.`
- `Seamlessly revolutionize your FiveM experience.`
- `Welcome back! Here's what's happening in your amazing community.`
- unexplained technical errors or vague `Something went wrong` messages when a safe actionable explanation is available.

## Empty states

Empty states should explain the state and next legitimate action:

`No applications are waiting for review.`

`No FiveM heartbeat has been received for this server. Check the resource/API configuration.`

`No upcoming training is scheduled.`

Avoid illustrations or oversized decorative empty-state cards unless they add actual guidance.
