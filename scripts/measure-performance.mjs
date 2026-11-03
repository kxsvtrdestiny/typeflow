import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3000/')
if (!base.pathname.endsWith('/')) base.pathname += '/'
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})})
const report={environment:'Chromium / 1440x1000; one synthetic sample per size; environment-specific measurement',typing:[],history:null}
try {
 for(const length of [1000,10000,100000]){
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(length=>{
   const date=new Date().toISOString(),content='The quiet morning brings time to read and write. '.repeat(Math.ceil(length/48)).slice(0,length)
   localStorage.setItem('typeflow.library',JSON.stringify({version:1,data:[{id:'custom-perf',name:'Performance sample',language:'en',description:'',difficulty:'beginner',isDefault:false,createdAt:date,updatedAt:date,articles:[{id:'perf-a',title:'Long text',content,difficulty:'beginner',createdAt:date,updatedAt:date}]}]}))
  },length)
  const started=Date.now()
  await page.goto(`${base}#/practice?themeId=custom-perf&articleId=perf-a`,{timeout:60000})
  await page.getByRole('button',{name:'开始训练',exact:true}).click({timeout:60000})
  const readyMs=Date.now()-started
  const samples=[]
  for(let i=1;i<=3;i++){
   const ms=await page.getByRole('textbox',{name:'训练输入'}).evaluate((node,count)=>new Promise(resolve=>{
    const start=performance.now();node.value='x'.repeat(count);node.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'x'}))
    requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-start)))
   }),i)
   samples.push(Math.round(ms))
  }
  report.typing.push({length,readyMs,eventToTwoFramesMs:samples,domCells:await page.locator('.typing-cell').count(),errors})
  console.log(JSON.stringify(report.typing.at(-1)))
  await page.close()
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  const date=new Date().toISOString()
  const records=Array.from({length:500},(_,i)=>({id:String(i),articleId:'perf',articleTitle:'History '+i,themeId:'perf',themeName:'Performance',language:'en',mode:'free',timedMinutes:1,startedAt:date,completedAt:date,finishReason:'article-completed',metrics:{cpm:3,wpm:0.6,accuracy:75,cumulativeAccuracy:75,correctCharacters:3,incorrectCharacters:1,submittedCharacters:4,totalInputCharacters:4,totalCorrectInputCharacters:3,elapsedMs:60000,progress:1},characterAnalysis:{version:1,characters:[{expected:String.fromCodePoint(0x4e00+i),attempts:1,errors:1},{expected:'A',attempts:3,errors:0}]}}))
  localStorage.setItem('typeflow.history',JSON.stringify({version:2,data:records}))
 })
 const started=Date.now()
 await page.goto(`${base}#/history`)
 await page.getByText('错误字符分析',{exact:true}).click()
 await page.getByRole('group',{name:'错误分析语言'}).getByRole('button',{name:'English'}).click()
 await page.locator('.error-character-list li').last().waitFor()
 const readyMs=Date.now()-started
 const switchStart=Date.now()
 await page.getByRole('combobox',{name:'错误分析排序'}).selectOption('highRate')
 report.history={records:await page.locator('.history-record').count(),errorCharacters:await page.locator('.error-character-list li').count(),readyMs,sortActionMs:Date.now()-switchStart,errors}
 console.log(JSON.stringify(report.history))
 if (process.argv[3]) await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify(report,null,2))
}finally{await browser.close()}
