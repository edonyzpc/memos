// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.35.1
// 	protoc        (unknown)
// source: store/memo.proto

package store

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type MemoPayload struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// property is the memo's property.
	Property *MemoPayload_Property `protobuf:"bytes,1,opt,name=property,proto3" json:"property,omitempty"`
}

func (x *MemoPayload) Reset() {
	*x = MemoPayload{}
	mi := &file_store_memo_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MemoPayload) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MemoPayload) ProtoMessage() {}

func (x *MemoPayload) ProtoReflect() protoreflect.Message {
	mi := &file_store_memo_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MemoPayload.ProtoReflect.Descriptor instead.
func (*MemoPayload) Descriptor() ([]byte, []int) {
	return file_store_memo_proto_rawDescGZIP(), []int{0}
}

func (x *MemoPayload) GetProperty() *MemoPayload_Property {
	if x != nil {
		return x.Property
	}
	return nil
}

type MemoPayload_Property struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Tags               []string `protobuf:"bytes,1,rep,name=tags,proto3" json:"tags,omitempty"`
	HasLink            bool     `protobuf:"varint,2,opt,name=has_link,json=hasLink,proto3" json:"has_link,omitempty"`
	HasTaskList        bool     `protobuf:"varint,3,opt,name=has_task_list,json=hasTaskList,proto3" json:"has_task_list,omitempty"`
	HasCode            bool     `protobuf:"varint,4,opt,name=has_code,json=hasCode,proto3" json:"has_code,omitempty"`
	HasIncompleteTasks bool     `protobuf:"varint,5,opt,name=has_incomplete_tasks,json=hasIncompleteTasks,proto3" json:"has_incomplete_tasks,omitempty"`
}

func (x *MemoPayload_Property) Reset() {
	*x = MemoPayload_Property{}
	mi := &file_store_memo_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *MemoPayload_Property) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*MemoPayload_Property) ProtoMessage() {}

func (x *MemoPayload_Property) ProtoReflect() protoreflect.Message {
	mi := &file_store_memo_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use MemoPayload_Property.ProtoReflect.Descriptor instead.
func (*MemoPayload_Property) Descriptor() ([]byte, []int) {
	return file_store_memo_proto_rawDescGZIP(), []int{0, 0}
}

func (x *MemoPayload_Property) GetTags() []string {
	if x != nil {
		return x.Tags
	}
	return nil
}

func (x *MemoPayload_Property) GetHasLink() bool {
	if x != nil {
		return x.HasLink
	}
	return false
}

func (x *MemoPayload_Property) GetHasTaskList() bool {
	if x != nil {
		return x.HasTaskList
	}
	return false
}

func (x *MemoPayload_Property) GetHasCode() bool {
	if x != nil {
		return x.HasCode
	}
	return false
}

func (x *MemoPayload_Property) GetHasIncompleteTasks() bool {
	if x != nil {
		return x.HasIncompleteTasks
	}
	return false
}

var File_store_memo_proto protoreflect.FileDescriptor

var file_store_memo_proto_rawDesc = []byte{
	0x0a, 0x10, 0x73, 0x74, 0x6f, 0x72, 0x65, 0x2f, 0x6d, 0x65, 0x6d, 0x6f, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x12, 0x0b, 0x6d, 0x65, 0x6d, 0x6f, 0x73, 0x2e, 0x73, 0x74, 0x6f, 0x72, 0x65, 0x22,
	0xf9, 0x01, 0x0a, 0x0b, 0x4d, 0x65, 0x6d, 0x6f, 0x50, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x12,
	0x3d, 0x0a, 0x08, 0x70, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x0b, 0x32, 0x21, 0x2e, 0x6d, 0x65, 0x6d, 0x6f, 0x73, 0x2e, 0x73, 0x74, 0x6f, 0x72, 0x65, 0x2e,
	0x4d, 0x65, 0x6d, 0x6f, 0x50, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x2e, 0x50, 0x72, 0x6f, 0x70,
	0x65, 0x72, 0x74, 0x79, 0x52, 0x08, 0x70, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x1a, 0xaa,
	0x01, 0x0a, 0x08, 0x50, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x12, 0x12, 0x0a, 0x04, 0x74,
	0x61, 0x67, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x09, 0x52, 0x04, 0x74, 0x61, 0x67, 0x73, 0x12,
	0x19, 0x0a, 0x08, 0x68, 0x61, 0x73, 0x5f, 0x6c, 0x69, 0x6e, 0x6b, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x08, 0x52, 0x07, 0x68, 0x61, 0x73, 0x4c, 0x69, 0x6e, 0x6b, 0x12, 0x22, 0x0a, 0x0d, 0x68, 0x61,
	0x73, 0x5f, 0x74, 0x61, 0x73, 0x6b, 0x5f, 0x6c, 0x69, 0x73, 0x74, 0x18, 0x03, 0x20, 0x01, 0x28,
	0x08, 0x52, 0x0b, 0x68, 0x61, 0x73, 0x54, 0x61, 0x73, 0x6b, 0x4c, 0x69, 0x73, 0x74, 0x12, 0x19,
	0x0a, 0x08, 0x68, 0x61, 0x73, 0x5f, 0x63, 0x6f, 0x64, 0x65, 0x18, 0x04, 0x20, 0x01, 0x28, 0x08,
	0x52, 0x07, 0x68, 0x61, 0x73, 0x43, 0x6f, 0x64, 0x65, 0x12, 0x30, 0x0a, 0x14, 0x68, 0x61, 0x73,
	0x5f, 0x69, 0x6e, 0x63, 0x6f, 0x6d, 0x70, 0x6c, 0x65, 0x74, 0x65, 0x5f, 0x74, 0x61, 0x73, 0x6b,
	0x73, 0x18, 0x05, 0x20, 0x01, 0x28, 0x08, 0x52, 0x12, 0x68, 0x61, 0x73, 0x49, 0x6e, 0x63, 0x6f,
	0x6d, 0x70, 0x6c, 0x65, 0x74, 0x65, 0x54, 0x61, 0x73, 0x6b, 0x73, 0x42, 0x94, 0x01, 0x0a, 0x0f,
	0x63, 0x6f, 0x6d, 0x2e, 0x6d, 0x65, 0x6d, 0x6f, 0x73, 0x2e, 0x73, 0x74, 0x6f, 0x72, 0x65, 0x42,
	0x09, 0x4d, 0x65, 0x6d, 0x6f, 0x50, 0x72, 0x6f, 0x74, 0x6f, 0x50, 0x01, 0x5a, 0x29, 0x67, 0x69,
	0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x75, 0x73, 0x65, 0x6d, 0x65, 0x6d, 0x6f,
	0x73, 0x2f, 0x6d, 0x65, 0x6d, 0x6f, 0x73, 0x2f, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x2f, 0x67, 0x65,
	0x6e, 0x2f, 0x73, 0x74, 0x6f, 0x72, 0x65, 0xa2, 0x02, 0x03, 0x4d, 0x53, 0x58, 0xaa, 0x02, 0x0b,
	0x4d, 0x65, 0x6d, 0x6f, 0x73, 0x2e, 0x53, 0x74, 0x6f, 0x72, 0x65, 0xca, 0x02, 0x0b, 0x4d, 0x65,
	0x6d, 0x6f, 0x73, 0x5c, 0x53, 0x74, 0x6f, 0x72, 0x65, 0xe2, 0x02, 0x17, 0x4d, 0x65, 0x6d, 0x6f,
	0x73, 0x5c, 0x53, 0x74, 0x6f, 0x72, 0x65, 0x5c, 0x47, 0x50, 0x42, 0x4d, 0x65, 0x74, 0x61, 0x64,
	0x61, 0x74, 0x61, 0xea, 0x02, 0x0c, 0x4d, 0x65, 0x6d, 0x6f, 0x73, 0x3a, 0x3a, 0x53, 0x74, 0x6f,
	0x72, 0x65, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_store_memo_proto_rawDescOnce sync.Once
	file_store_memo_proto_rawDescData = file_store_memo_proto_rawDesc
)

func file_store_memo_proto_rawDescGZIP() []byte {
	file_store_memo_proto_rawDescOnce.Do(func() {
		file_store_memo_proto_rawDescData = protoimpl.X.CompressGZIP(file_store_memo_proto_rawDescData)
	})
	return file_store_memo_proto_rawDescData
}

var file_store_memo_proto_msgTypes = make([]protoimpl.MessageInfo, 2)
var file_store_memo_proto_goTypes = []any{
	(*MemoPayload)(nil),          // 0: memos.store.MemoPayload
	(*MemoPayload_Property)(nil), // 1: memos.store.MemoPayload.Property
}
var file_store_memo_proto_depIdxs = []int32{
	1, // 0: memos.store.MemoPayload.property:type_name -> memos.store.MemoPayload.Property
	1, // [1:1] is the sub-list for method output_type
	1, // [1:1] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_store_memo_proto_init() }
func file_store_memo_proto_init() {
	if File_store_memo_proto != nil {
		return
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_store_memo_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   2,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_store_memo_proto_goTypes,
		DependencyIndexes: file_store_memo_proto_depIdxs,
		MessageInfos:      file_store_memo_proto_msgTypes,
	}.Build()
	File_store_memo_proto = out.File
	file_store_memo_proto_rawDesc = nil
	file_store_memo_proto_goTypes = nil
	file_store_memo_proto_depIdxs = nil
}
