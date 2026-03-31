# Spanned Drive Frontend Rust

This application is under development

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).

### Pre-Requisites (Ubuntu/Debian)

```
# Install packages 

sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  7zip
```

```
# Install Rust

curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

```
# Install Deno

curl -fsSL https://deno.land/install.sh | sh
```

## Nginx Config

```
# /etc/nginx/sites-available/sdrive
echo """server {
        listen 80 ;
        listen [::]:80 ;

        # Allow These names in URL
        server_name _ localhost sdrive;

        location /sdrive {
                alias /var/www/sdrive/;
                index index.html;
                try_files $uri $uri/ =404;
        }
}""" > /etc/nginx/sites-available/sdrive

# Enable the site and reload Nginx
sudo ln -s /etc/nginx/sites-available/sdrive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```