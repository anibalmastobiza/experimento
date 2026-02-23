# OSF Upload Instructions

## 1) Set credentials
Use a personal access token from your OSF account.

```bash
export OSF_TOKEN="paste_your_osf_token_here"
```

## 2) Create a new OSF project (optional)
If you do not have a project yet:

```bash
python3 "/Users/anibalmonasterioastobiza/Documents/New project/scripts/create_osf_project.py" \
  "Event Boundaries and Epistemic Deference to AI (Pilot + Materials)"
```

The script prints the project ID (for example `abc12`).

## 3) Set project ID

```bash
export OSF_PROJECT_ID="your_project_id"
```

## 4) Upload all materials

```bash
"/Users/anibalmonasterioastobiza/Documents/New project/scripts/upload_osf_package.sh"
```

This uploads everything in:

`/Users/anibalmonasterioastobiza/Documents/New project/osf_package`

to:

`osfstorage/osf_package/`

## 5) Verify upload

```bash
PYTHONPATH="/Users/anibalmonasterioastobiza/Documents/New project/.vendor" \
OSF_TOKEN="$OSF_TOKEN" \
python3 -m osfclient -p "$OSF_PROJECT_ID" ls osfstorage/osf_package
```
