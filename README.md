
  # Clickable Dithered Planets

  This is a code bundle for Clickable Dithered Planets. The original project is available at https://www.figma.com/design/f47KeR6KPEKrizkp5PBdec/Clickable-Dithered-Planets.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Populate labels via ThemeScope (optional)

  This app can fetch themes/subthemes/links from your Chrome history using the ThemeScope API.

  1. Install ThemeScope (from the sibling `cal/themescope` dir):

     ```bash
     cd ../../cal/themescope
     uv pip install -e .[llm]
     export OPENAI_API_KEY=sk-...your-key...
     ```

  2. Run the API server:

     ```bash
     uv pip install -e ".[server]"
     uv run uvicorn themescope.api_server:app --host 127.0.0.1 --port 8000
     # serves at http://127.0.0.1:8000
     ```

  3. In this `orbit` app, copy the sample config and edit `historyPath` if needed:

     ```bash
     cp public/themescope_config.sample.json public/themescope_config.json
     # edit public/themescope_config.json
     ```

  4. Start the Vite dev server if not already running:

     ```bash
     npm run dev
     ```

  If the config is present and the API is running, the app will fetch `5–8` themes (level 1), `2–4` subthemes per theme (level 2), and `2–4` links per subtheme (level 3). If not, it falls back to `public/themescope_orbit.json`.
  