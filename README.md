# gator

A command-line RSS feed aggregator. Register users, add RSS feeds, and follow the feeds you care about. All data lives in PostgreSQL.

## Requirements

- [Node.js](https://nodejs.org/) 22 or newer (with npm)
- [PostgreSQL](https://www.postgresql.org/) 16 or newer, running and reachable

## Setup

1. Clone and install dependencies:

   ```sh
   git clone https://github.com/khaledmareimed/gator.git
   cd gator
   npm install
   ```

2. Create a database for gator:

   ```sh
   createdb gator
   ```

3. Create the config file `~/.gatorconfig.json` in your home directory with your connection string:

   ```json
   {
     "db_url": "postgres://username:password@localhost:5432/gator?sslmode=disable"
   }
   ```

   gator adds a `current_user_name` field itself when you register or log in.

4. Create the tables:

   ```sh
   npm run migrate
   ```

## Usage

Run commands with `npm run start <command> [args]`:

```sh
npm run start register alice        # create a user and log in as them
npm run start addfeed "Lane's Blog" https://www.wagslane.dev/index.xml
npm run start following             # feeds you follow
```

### Commands

| Command | Description |
| --- | --- |
| `register <name>` | Create a user and log in as them |
| `login <name>` | Switch to an existing user |
| `users` | List all users, marking the current one |
| `addfeed <name> <url>` | Add a feed and follow it |
| `feeds` | List all feeds and who added them |
| `follow <url>` | Follow a feed someone already added |
| `following` | List the feeds the current user follows |
| `unfollow <url>` | Stop following a feed |
| `agg` | Fetch a feed and print it (work in progress) |
| `reset` | **Delete all users, feeds and follows.** For development only |

`addfeed`, `follow`, `following` and `unfollow` need a logged-in user.
