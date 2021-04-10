const puppeteer = require('puppeteer');
const _cliProgress = require('cli-progress');
//const crypto = require('crypto');

//require("./welcome");
var spinner = require("./step");
var utils = require("./utils");
var qrcode = require('qrcode-terminal');
var path = require("path");

//console.log(ps);

//console.log(process.cwd());

async function Main() {

    try {
        var page;
        await downloadAndStartThings();
        var isLogin = await checkLogin();
        if (!isLogin) {
            await getAndShowQR();
        }
    } catch (e) {
        console.error("Error interno");
        page.screenshot({ path: path.join(process.cwd(), "error.png") })
        throw e;
    }
	
    /**
     * If local chrome is not there then this function will download it first. then use it for automation. 
     */
    async function downloadAndStartThings() {
        let botjson = utils.externalInjection("bot.json");		
        spinner.start("Verificando estado del componente actual\n");
        const browserFetcher = puppeteer.createBrowserFetcher({
            path: process.cwd()
        });
        const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_grey);
        progressBar.start(100, 0);

        const revisionInfo = await browserFetcher.download("619290", (download, total) => {
            //console.log(download);
            var percentage = (download * 100) / total;
            progressBar.update(percentage);
        });
        progressBar.update(100);
        spinner.stop("Descargando componentes Internos");
        //console.log(revisionInfo.executablePath);
        spinner.start("Creando estructura en caché");
        const browser = await puppeteer.launch({
            executablePath: revisionInfo.executablePath,
            headless: true,
            userDataDir: path.join(process.cwd(), "ChromeSession"),
            devtools: false,
			ignoreHTTPSErrors: true
        });
        spinner.stop("Virtualizando sesión en Google Chrome");
        spinner.start("Integrando Audara Bot a sesión de whatsapp");
        page = await browser.pages();
        if (page.length > 0) {
            page = page[0];
            page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3336.0 Safari/537.36")
            await page.goto('https://web.whatsapp.com', {
                waitUntil: 'networkidle0',
                timeout: 0
            });
            //console.log(contents);
            var filepath = path.join(__dirname, "WAPI.js");
            await page.addScriptTag({path: require.resolve(filepath)});
			filepath = path.join(__dirname, "aes.js");
            await page.addScriptTag({path: require.resolve(filepath)});	
            filepath = path.join(__dirname, "inject.js");
            await page.addScriptTag({path: require.resolve(filepath)});
			filepath = path.join(__dirname, "api.js");
            await page.addScriptTag({path: require.resolve(filepath)});
			filepath = path.join(__dirname, "message.js");
            await page.addScriptTag({path: require.resolve(filepath)});				
            botjson.then((data) => {
                page.evaluate("var intents = " + data);
                //console.log(data);
            }).catch((err) => {
                console.log("Ocurrio un erro interno: \n" + err);
            });
            spinner.stop("Virtualizando sesión en Whatsapp!");
        }
    }

    async function checkLogin() {
        spinner.start("Verificando eventos de la sesión");
        //TODO: avoid using delay and make it in a way that it would react to the event. 
        utils.delay(3000);
        //console.log("loaded");
        var output = await page.evaluate("WAPI.isLoggedIn();");
        //console.log("\n" + output);
        if (output) {
            spinner.stop("Tu sesión se ha cargado con éxito!");
            console.log(await page.evaluate("window.chrome;"));
            console.log(await page.evaluate("window.outerWidth;"));
            console.log(await page.evaluate("window.outerHeight;"));

        } else {
            spinner.info("Apunta tu telefono con la cámara encendida, para escanear el código QR.");
        }
        return output;
    }

    //TODO: add logic to refresh QR.
    async function getAndShowQR() {
        await utils.delay(5000);
		console.clear();
        var imageData = await page.evaluate(`document.querySelector("img[alt='Scan me!']").parentElement.getAttribute("data-ref")`);
        qrcode.generate(imageData, { small: true });		
        spinner.start("El código QR vence en 15 segundos.\n");
        var isLoggedIn = await page.evaluate("WAPI.isLoggedIn();");
		setTimeout(function(){
			if( !isLoggedIn ){
				getAndShowQR();	
			}			
		}, 500);		
        while (!isLoggedIn) {
            //console.log("page is loading");
            //TODO: avoid using delay and make it in a way that it would react to the event. 
            await utils.delay(300);
            isLoggedIn = await page.evaluate("WAPI.isLoggedIn();");
        }			
        if (isLoggedIn) {
            spinner.stop("La sincronización está corriendo en segundo plano");
            console.log("Audara Bot se está ejecutando");
        }
    }
}

Main();