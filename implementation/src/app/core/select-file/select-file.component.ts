import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ShaclFile } from '@models/shacl-file';
import { Shape } from '@models/shape';
import { ApiService } from '@services/api.service';
import { FormfieldControlService } from '@services/form-field.service';
import { Utils } from '@shared/utils';
import { ModalService } from '../_modal';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-select-file',
  templateUrl: './select-file.component.html',
  styleUrls: ['./select-file.component.scss'],
})
export class SelectFileComponent implements OnInit {
  files: string[];
  participantFiles: string[] = [];
  serviceFiles: string[];
  defaultFiles: string[];
  coreFiles: string[];
  otherFiles: string[];
  complianceFiles: string[];
  configurationFiles: string[];
  shaclFile: ShaclFile;
  filteredShapes: Shape[];
  requestError: boolean;
  public trigger: number = 0;
  public ecosystems: any[] =[];
  public ecosystemSelected: string = ''

  ecosystem: string = 'simpl'; // pass this to getFiles Api

  constructor(
    private renderer: Renderer2,
    private element: ElementRef,
    private apiService: ApiService,
    private formFieldService: FormfieldControlService,
    private router: Router,
    private modalService: ModalService,
    private http: HttpClient
  ) {
    this._getFiles();
  }

  ngOnInit(): void {}
  _getFiles() {
    this.apiService.getFiles().subscribe((res) => {
      this.ecosystems = this.getJsonEntries(res);
      this.ecosystemSelected = this.ecosystems[0][0];
      this.requestShapes(this.ecosystemSelected);
    });
  }
  getJsonEntries(obj: any): [string, any][] {
    return Object.entries(obj);
  }
  requestShapes(system: string) {
    //pass the system string down here
    this.apiService.getFilesCategorized(system).subscribe((res) => {
      //this.files = res;
      this.defaultFiles = res?.Resource;
      this.serviceFiles = res?.Service;
      this.participantFiles = res?.Participant;
      this.coreFiles = res?.Core;
      this.complianceFiles = res?.Compliance;
      this.configurationFiles = res?.Configuration;
      this.otherFiles = res?.Other;
    });
  }
  select(name: string): void {
    this.apiService.getJSON(this.ecosystemSelected, name).subscribe(
      (res) => {
        this.shaclFile = this.formFieldService.readShaclFile(res);
        this.filteredShapes = this.formFieldService.updateFilteredShapes(
          this.shaclFile
        );
        if (this.filteredShapes.length > 1) {
          this.router.navigate(['/select-shape'], {
            state: { file: this.shaclFile },
          });
        } else {
          console.log('this here' + this.shaclFile);
          console.table(this.shaclFile);
          //set description.input value depending on language
          this.updateSelectedShape();
          this.closeModal('upload-modal');
          this.router.navigate(['/form'], { state: { file: this.shaclFile } });
        }
      },
      (err) => (this.requestError = true)
    );
  }

  updateSelectedShape(): void {
    const shape = this.filteredShapes[0];
    if (shape !== undefined) {
      this.shaclFile.shapes.find((x) => x.name === shape.name).selected = true;
    }
  }

  getFileName(fullFileName: string): string {
    // remove the extension of the file.
    return Utils.removeAfterCharacter(fullFileName);
  }
  openModal(id: string) {
    this.modalService.open(id);
  }

  closeModal(id: string) {
    this.modalService.close(id);
  }
  @ViewChild('uploadanimation') uploadanimation: ElementRef;
  @ViewChild('contents') contents: ElementRef;

  file: any;
  onFileSelected(event: any, id: string) {
    this.file = event.target.files[0];
    // close modal after recieveing file
    //create load animation if all successful
    this.uploadanimation.nativeElement.setAttribute('begin', 'definite');
    this.uploadanimation.nativeElement.beginElement();
    this.contents.nativeElement.remove();
    this.modalService.close(id);
  }
  reload(ecosystem: string) {
    this.ecosystemSelected = ecosystem
 
    //request updated shapes
    this.requestShapes(ecosystem);
    //invoke rerender
    this.trigger++;
  }
}
