import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PoliciesComponent } from "./policies/policies.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { PoliciesService } from "./policies.service";
import { EditDialogComponent } from "./edit-dialog/edit-dialog.component";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  // MatDatepickerModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
  MatFormFieldModule,
  MatOptionModule,
  MatChipsModule,
  MatExpansionModule,
  MatButtonToggleModule
} from "@angular/material";
import { SharedCatanieModule } from "shared/shared.module";

import { StoreModule } from "@ngrx/store";
import { policiesReducer } from "state-management/reducers/policies.reducer";
import { PoliciesDashboardComponent } from "./policies-dashboard/policies-dashboard.component";
import { FlexModule } from "@angular/flex-layout";

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatTableModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatInputModule,
    MatButtonModule,
    MatSortModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedCatanieModule,
    MatSelectModule,
    MatOptionModule,
    MatNativeDateModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    StoreModule.forFeature("policies", policiesReducer),
    MatDialogModule,
    MatExpansionModule,
    FlexModule
  ],
  declarations: [
    PoliciesComponent,
    EditDialogComponent,
    PoliciesDashboardComponent
  ],
  providers: [PoliciesService],
  exports: [PoliciesComponent],
  entryComponents: [EditDialogComponent]
})
export class PoliciesModule {}
