import {
  async,
  ComponentFixture,
  TestBed,
  inject
} from "@angular/core/testing";

import { DatasetDetailsDashboardComponent } from "./dataset-details-dashboard.component";
import { MockStore, MockActivatedRoute, MockUserApi } from "shared/MockStubs";
import { Store, StoreModule } from "@ngrx/store";
import {
  clearFacetsAction,
  addKeywordFilterAction,
  addAttachmentAction,
  updateAttachmentCaptionAction,
  removeAttachmentAction,
  saveDatasetAction
} from "state-management/actions/datasets.actions";
import { Dataset, UserApi, RawDataset } from "shared/sdk";
import { ReadFile, ReadMode } from "ngx-file-helpers";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { AppConfigModule, APP_CONFIG } from "app-config.module";
import { SharedCatanieModule } from "shared/shared.module";
import { rootReducer } from "state-management/reducers/root.reducer";
import { Router, ActivatedRoute } from "@angular/router";
import { SubmitCaptionEvent } from "shared/modules/file-uploader/file-uploader.component";

describe("DetailsDashboardComponent", () => {
  let component: DatasetDetailsDashboardComponent;
  let fixture: ComponentFixture<DatasetDetailsDashboardComponent>;

  const router = {
    navigateByUrl: jasmine.createSpy("navigateByUrl")
  };
  let store: MockStore;
  let dispatchSpy;
  let pipeSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [DatasetDetailsDashboardComponent],
      imports: [
        AppConfigModule,
        SharedCatanieModule,
        StoreModule.forRoot({ rootReducer })
      ]
    });
    TestBed.overrideComponent(DatasetDetailsDashboardComponent, {
      set: {
        providers: [
          { provide: Router, useValue: router },
          {
            provide: APP_CONFIG,
            useValue: {
              editMetadataEnabled: true
            }
          },
          { provide: ActivatedRoute, useClass: MockActivatedRoute },
          { provide: UserApi, useClass: MockUserApi }
        ]
      }
    });
    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetDetailsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(inject([Store], (mockStore: MockStore) => {
    store = mockStore;
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("#onClickKeyword()", () => {
    it(" should update datasets keyword filter and navigate to datasets table", () => {
      dispatchSpy = spyOn(store, "dispatch");
      const keyword = "test";
      component.onClickKeyword(keyword);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenCalledWith(clearFacetsAction());
      expect(dispatchSpy).toHaveBeenCalledWith(
        addKeywordFilterAction({ keyword })
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith("/datasets");
    });
  });

  describe("#onClickProposal()", () => {
    it("should navigate to a proposal", () => {
      const proposalId = "ABC123";
      component.onClickProposal(proposalId);

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        "/proposals/" + proposalId
      );
    });
  });

  describe("#onClickSample()", () => {
    it("should navigate to a sample", () => {
      const sampleId = "testId";
      component.onClickSample(sampleId);

      expect(router.navigateByUrl).toHaveBeenCalledWith("/samples/" + sampleId);
    });
  });

  describe("#onSaveMetadata()", () => {
    it("should dispatch a SaveDatasetAction", () => {
      dispatchSpy = spyOn(store, "dispatch");

      component.dataset = new RawDataset();
      const saveDataset = { ...component.dataset } as RawDataset;
      const metadata = {};
      component.onSaveMetadata(metadata);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        saveDatasetAction({ dataset: saveDataset, metadata })
      );
    });
  });

  describe("#resetDataset()", () => {
    it("should return 'null' without confirmation", () => {
      dispatchSpy = spyOn(store, "dispatch");
      pipeSpy = spyOn(store, "pipe");
      const dataset = new Dataset();
      const res = component.resetDataset(dataset);

      expect(res).toBeNull();
      expect(dispatchSpy).toHaveBeenCalledTimes(0);
      expect(pipeSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe("#onFileUploaderFilePicked()", () => {
    it("should set the value of pickedFile", () => {
      expect(component.pickedFile).toBeUndefined();
      const file: ReadFile = {
        name: "test",
        size: 100,
        type: "image/png",
        readMode: ReadMode.dataURL,
        content: "abc123",
        underlyingFile: {
          lastModified: 123,
          name: "test",
          size: 100,
          type: "image/png",
          slice: () => new Blob().slice()
        }
      };
      component.onFileUploaderFilePicked(file);

      expect(component.pickedFile).toEqual(file);
    });
  });

  describe("#onFileUploaderReadEnd()", () => {
    it("should do nothing if fileCount is not larger than zero", () => {
      dispatchSpy = spyOn(store, "dispatch");

      component.onFileUploaderReadEnd(0);

      expect(dispatchSpy).toHaveBeenCalledTimes(0);
    });

    it("should dispatch an AddAttchment action if fileCount is larger than zero", () => {
      dispatchSpy = spyOn(store, "dispatch");

      component.dataset = new RawDataset();
      component.pickedFile = {
        name: "test",
        size: 100,
        type: "image/png",
        readMode: ReadMode.dataURL,
        content: "abc123",
        underlyingFile: {
          lastModified: 123,
          name: "test",
          size: 100,
          type: "image/png",
          slice: () => new Blob().slice()
        }
      };
      component.onFileUploaderReadEnd(1);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        addAttachmentAction({ attachment: component.attachment })
      );
    });
  });

  describe("#updateCaption()", () => {
    it("should dispatch an UpdateAttachmentCaptionAction", () => {
      dispatchSpy = spyOn(store, "dispatch");

      component.dataset = new RawDataset();
      const event: SubmitCaptionEvent = {
        attachmentId: "testAttachmentId",
        caption: "Test caption"
      };
      component.updateCaption(event);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        updateAttachmentCaptionAction({
          datasetId: component.dataset.pid,
          attachmentId: event.attachmentId,
          caption: event.caption
        })
      );
    });
  });

  describe("#deleteAttachment()", () => {
    it("should dispatch a DeleteAttachment action", () => {
      dispatchSpy = spyOn(store, "dispatch");

      component.dataset = new RawDataset();
      const attachmentId = "testAttachmentId";
      component.deleteAttachment(attachmentId);

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(
        removeAttachmentAction({
          datasetId: component.dataset.pid,
          attachmentId
        })
      );
    });
  });
});
