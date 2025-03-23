# AwakenedAI-Web Development Log

## Day 5

### Summary:
Based on yesterday's decision, we split the project into 2 repos, Processing and Web. By the end of the session we succeeded in catching the web version up to the cli trial version"

Today's activities:
- Created Web Repo (AwakenedAI-Web) 
- Set up Next.js project structure with TypeScript
- Implemented basic search UI components
- Created API routes for vector search and completion
- Integrated with Supabase for vector retrieval
- Connected OpenAI API for response generation
- Successfully matched CLI functionality in web interface

### Biggest Challenge:
The bot was not able to find any context, and we spent a lot of time trying to replicate the functionality of the CLI version. After the ai did it very differently on first attempt, we moved the processing repo into the web repo, so that a fresh ai session could reference it for help

## Day 6
- Updated UI to version 1 from default version 0
- Set up Vercel project
- Prod link from Vercel is always up

## Day 11
- Fixes query system so response takes few seconds, rather than near 10 seconds or timing out
- Implements conversation feature
	- Users can create new conversations and return to existing ones
		- Preserved locally for now
- Revamps UI
	- Removes unecessary junk that links to nowhere, etc
	- Conversation sidebar
	- Chat takes up most of width of screen
	- Implements streaming for gradual chat response, and faster rather than instantaneous at the end

## Day 17
- Updating Readme
- Removing extraneous UI

## Day 18
- Ading HNSW indexing to increase speed and prevent timeouts
	- Couldn't via web sql dashboard bc timeouts, so:
	- Installed supabase cli
	- Running migration via cli
	- Too intensive, had to clear db and add HSNW in processing repo, need to reprocess