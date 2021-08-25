import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-long-identifier-display',
  templateUrl: './long-identifier-display.component.html',
  styleUrls: ['./long-identifier-display.component.scss']
})
export class LongIdentifierDisplayComponent implements OnInit {

  @Input() DisplayValue: string;
  @Input() Value: string;

  constructor(private _snackBar: MatSnackBar) {

   }

  ngOnInit(): void {
    let id= this.Value;
       
        let shortenAddress = id.substring(0,4) + "....." + id.substring(id.length-4);
       
        this.DisplayValue = shortenAddress;
  }

  CopyContent(event:any){
    console.log(event);
    this.copyTextToClipboard(this.Value);
    
    this._snackBar.open('Address Copied!', 'close');
    //toast({html: 'Address Copied!'})
  }

  copyTextToClipboard(text: any) {
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = "0";
    textArea.style.left = "0";
  
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    textArea.style.padding = "0";
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild(textArea);
  
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }
  
    document.body.removeChild(textArea);
  }

}
