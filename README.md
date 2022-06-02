# briefcase.github.io
> Demo of Hosting or Deploying ionic app on GitHub pages
> Firt Demo to create a briefcase to show in your github page created on ionic angular
> Github pages allows you to host static websites and web apps for free using the same workflow you use to host repositories, you just commit and push. Build and Deploying of static website to GitHub Pages can be automated. You can even associate a custom top level domain name to your website or web app by adding a CNAME file.

## Prerequisites

- Ionic requires latest Node.js version
  - To check your version, run node -v in a terminal/console window.
  - To get Node.js, go to https://nodejs.org
- npm package manager
  - To check your version run npm -v in a terminal/console window
  - Install npm client - https://docs.npmjs.com/cli/install
  
## Install Ionic

```
npm install -g ionic
```
> The -g option means install globally.

## Start an app

Create an Ionic app using one of the pre-made app templates, or a blank one to start fresh. 

```
$ ionic start briefcase.github.io blank
✔ Preparing directory ./ionic-github-pages-demo - done!
✔ Downloading and extracting tabs starter - done!
...
```

## Run the App

```
$ cd briefcase.github.io/
$ ionic serve

> ng run app:serve --host=localhost --port=8100
[INFO] Development server running!
       Local: http://localhost:8100
```

## Create a Repository on GitHub

- Goto your GitHub Home page -> Repositories -> Click New
- Specify your repo name ionic-github-pages-demo
- Leave it public and add a README file
- Create Repo

You should find instrutions to push an existing repository from the command line:

```
git remote add origin https://github.com/Alfonso-13/briefcase.github.io.git
git push -u origin master
```
> GitHub Pages allows you to create `single sites per GitHub account and organization` and `unlimited project sites`. Detailed instructions are provided here `https://pages.github.com/`

## In your angular project, add new remote for GitHub

```
$ git remote add origin https://github.com/Alfonso-13/briefcase.github.io.git
```
Verify

```
$ git remote -v
origin	https://github.com/Alfonso-13/briefcase.github.io.git (fetch)
origin	https://github.com/Alfonso-13/briefcase.github.io.git (push)
```

## Config your package.json
Navigate to the file package.json to chang the base directory `ng build --base-href=/<repository>/`

## Build your ionic app
Navigate in the terminal to your project directory and execute `ng build --base-href=/<repository>/`

```
npm run build
...
```

This will create the www folder with output bundles for your ionic application.
This create the file .nojekyll to the configuration GitHub Pages settings

## Add `angular-cli-ghpages` npm module to your project.

```
$ ng add angular-cli-ghpages
```

> `angular-cli-ghpages` is npm module which simplify the build deploy process for angular apps. It is build on top of https://github.com/Alfonso-13/briefcase.github.io/gh-pages

## Deploy your project to GitHub pages.

Then run the plugin `npx angular-cli-ghpages` with --dir=www as input. Your angular application will be deployed to `gh-pages` branch of your repository.

```
$ npx angular-cli-ghpages --dir=www
🚀 Uploading via git, please wait...
🌟 Successfully published via angular-cli-ghpages! Have a nice day!

```

## Verify/Update GitHub Pages settings

- Goto Github repository settings -> GitHub Pages section
- Make sure `Source` is set to `gh-pages` branch. 
- Your site is published at https://github.com/Alfonso-13/briefcase.github.io/



