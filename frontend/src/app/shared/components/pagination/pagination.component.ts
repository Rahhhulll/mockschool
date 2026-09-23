import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<mat-paginator [length]="length" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="pageSizeOptions" (page)="pageChange.emit($event)" aria-label="Pagination"></mat-paginator>`,
})
export class PaginationComponent {
  @Input() length = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Output() readonly pageChange = new EventEmitter<PageEvent>();
}
